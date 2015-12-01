/**
 * JSNES - JavaScript NES Emulator
 *
 * (C) Thomas Bell 2015
 * MIT Licensed
 *
 * Portions derived from bnes - a part of the Higan project (formerly bsnes)
 *   (C) byuu, Ryphecha 2011
 *   under the GNU GPLv3
 */

(function(){})();

function MOS6502() {
    var programCounter = new Uint16Array(1);
    Object.defineProperty(this, "programCounter", {
        get: function () { return programCounter[0]; },
        set: function (v) { programCounter[0] = v; }
    });

    var stackPointer = new Uint8Array(1);
    Object.defineProperty(this, "stackPointer", {
        get: function () { return stackPointer[0]; },
        set: function (v) { stackPointer[0] = v; }
    });

    this.registers = new Uint8Array(3);
    this.interruptVectors = new Uint8Array(6);
    this.memory = new Uint8Array(65536);

    this.prepareTable();
}
MOS6502.prototype = {
    constructor: MOS6502,

    CARRY: false,       // C
    ZERO: false,        // Z
    IRQ_DISABLE: true,  // I
    DECIMAL: false,     // D
    // http://wiki.nesdev.com/w/index.php/CPU_status_flag_behavior
    //BREAK: true,        // B
    NEGATIVE: false,    // N
    OVERFLOW: false,    // V

    options: {
        ignoreInvalidInstructions: true,
        disableDecimal: false
    },

    reset: function () {
        this.programCounter = this._getMemory_16Bit(0xFFFC);
        this.stackPointer -= 3;
        this.IRQ_DISABLE = true;
        this._setMemory(0x4015, 0);
    },

    registers: [
        0, // A
        0, // X
        0  // Y
    ],
    REGISTERS: {
        A: 0,
        X: 1,
        Y: 2
    },

    programCounter: 0x0,
    stackPointer: 0xFD,

    interruptVectors: [
        0, 0, // 0xFFFA, nmi
        0, 0, // 0xFFFC, reset
        0, 0  // 0xFFFE, irq
    ],

    _getRegister: function (reg) {
        return this.registers[reg];
    },
    _setRegister: function (reg, value) {
        this.registers[reg] = value;
        return this;
    },
    _setAccumulatorWithFlags: function (value) {
        if (this.DECIMAL && !this.options.disableDecimal) {
            this._setRegister(this.REGISTERS.A, this._BCDToBinary(value & 0xFF));
            this.CARRY = ((value & 0xF0) >> 4) > 9;
        } else {
            this._setRegister(this.REGISTERS.A, value & 0xFF);
            this.CARRY = value > 0xFF;
        }

        this._setFlagsFromValue(value);
        return this;
    },

    _getMemory: function (addr) {
        switch (true) {
            case addr < 0xFFFA:
                return this.memory[addr];
            case addr < 0x10000:
                return this.interruptVectors[(addr - 0xFFFA)];
            default:
                return 0;
        }
    },
    _setMemory: function (addr, value) {
        switch (true) {
            case addr < 0xFFFA:
                this.memory[addr] = value;
                break;
            case addr < 0x10000:
                this.interruptVectors[(addr - 0xFFFA)] = value;
                break;
        }
        return this;
    },

    _getMemory_16Bit: function (addr) {
        return this._getMemory(addr) | (this._getMemory(addr+1) << 8);
    },

    _setFlagsFromValue: function (value) {
        this.ZERO = Boolean(value === 0);
        this.NEGATIVE = Boolean(value & 0x80);
        return this;
    },
    _setFlagsFromRegister: function (reg) {
        return this
            ._setFlagsFromRegister(this._getRegister(reg));
    },

    _loadRegister: function (reg, value) {
        return this
            ._setRegister(reg, value)
            ._setFlagsFromValue(value);
    },

    _storeRegister: function (reg, addr) {
        return this
            ._setMemory(addr, this._getRegister(reg));
    },

    pushStack: function (value) {
        this._setMemory(0x0100 + this.stackPointer, value);
        this.stackPointer--;
        return this;
    },
    popStack: function () {
        this.stackPointer++;
        return this._getMemory(0x0100 + this.stackPointer);
    },

    _getPS: function () {
        return (
            (this.NEGATIVE      << 7) |
            (this.OVERFLOW      << 6) |
            (1                  << 5) |
            (0                  << 4) |
            (this.DECIMAL       << 3) |
            (this.IRQ_DISABLE   << 2) |
            (this.ZERO          << 1) |
            (this.CARRY         << 0)
        );
    },
    _setPS: function (value) {
        this.NEGATIVE =     Boolean((value >> 7) & 1);
        this.OVERFLOW =     Boolean((value >> 6) & 1);

        //this.BREAK =        Boolean((value >> 4) & 1);
        this.DECIMAL =      Boolean((value >> 3) & 1);
        this.IRQ_DISABLE =  Boolean((value >> 2) & 1);
        this.ZERO =         Boolean((value >> 1) & 1);
        this.CARRY =        Boolean((value >> 0) & 1);
        return this;
    },

    _binaryToBCD: function (n) {
        var hi_nibble = (value & 0xF0) >> 4,
            lo_nibble = (value & 0x0F);

        return (hi_nibble * 10) + lo_nibble;
    },
    _BCDToBinary: function (n) {
        var high = Math.floor(n / 10) & 0xF,
            low = Math.abs(n % 10);

        return (high << 4) | low;
    },

    _xcrement: function (reg, sign) {
        var result = (this._getRegister(reg) + sign) & 0xFF;
        return this
            ._setRegister(reg, result)
            ._setFlagsFromValue(result);
    },
    _xcrement_memory: function (addr, sign) {
        var result = (this._getMemory(addr) + sign) & 0xFF;
        return this
            ._advanceCycles(2)
            ._setMemory(addr, result)
            ._setFlagsFromValue(result);
    },

    _branch: function (offset) {
        var delta;
        if (offset & 0x80) delta = -(-offset & 0xFF);
        else delta = offset & 0xFF;

        if ((this.programCounter ^ (this.programCounter += delta)) & 0x100)
            this._advanceCycles(2);
        else this._advanceCycles(1);
    },

    _compare: function (reg, value) {
        var result = this._getRegister(reg) - value;
        this._setFlagsFromValue(result);
        this.CARRY = !this.NEGATIVE;
    },

    cycles: 0,
    clockSpeed: 1790000,
    frameRate: 30,
    _advanceCycles: function (n) { this.cycles += n; return this; },

    LDA: function (value) { this._loadRegister(this.REGISTERS.A, value); },
    LDX: function (value) { this._loadRegister(this.REGISTERS.X, value); },
    LDY: function (value) { this._loadRegister(this.REGISTERS.Y, value); },

    STA: function (addr) { this._storeRegister(this.REGISTERS.A, addr); },
    STX: function (addr) { this._storeRegister(this.REGISTERS.X, addr); },
    STY: function (addr) { this._storeRegister(this.REGISTERS.Y, addr); },

    SED: function () { this.DECIMAL = true; },
    CLD: function () { this.DECIMAL = false; },

    SEC: function () { this.CARRY = true; },
    CLC: function () { this.CARRY = false; },

    SEI: function () { this.IRQ_DISABLE = true; },
    CLI: function () { this.IRQ_DISABLE = false; },

    CLV: function () { this.OVERFLOW = false; },

    ADC: function (value) {
        var a = this._getRegister(this.REGISTERS.A),
            result;
        if (this.DECIMAL && !this.options.disableDecimal) {
            result = this._binaryToBCD(a) + this._binaryToBCD(value) + (this.CARRY ? 1 : 0);

            this.OVERFLOW = false;
        } else {
            result = a + value + (this.CARRY ? 1 : 0);

            this.OVERFLOW = Boolean((a & 0x80) ^ (result & 0x80));
        }
        this._setAccumulatorWithFlags(this.REGISTERS.A, result);
    },

    SBC: function (value) {
        var a = this._getRegister(this.REGISTERS.A),
            result;
        if (this.DECIMAL && !this.options.disableDecimal) {
            result = this._binaryToBCD(a) - this._binaryToBCD(value) - (this.CARRY ? 0 : 1);

            this.OVERFLOW = false;
        } else {
            result = a - value - (this.CARRY ? 0 : 1);

            this.OVERFLOW = Boolean(((a & 0x80) ^ (value & 0x80)) && ((a & 0x80) ^ (value & 0x80)));
        }
        this.CARRY = !Boolean(result & 0x80);
        this._setFlagsFromValue(value);
        this._setRegister(this.REGISTERS.A, result);
    },

    DEX: function () { this._xcrement(this.REGISTERS.X, -1); },
    DEY: function () { this._xcrement(this.REGISTERS.Y, -1); },
    INX: function () { this._xcrement(this.REGISTERS.X, 1); },
    INY: function () { this._xcrement(this.REGISTERS.Y, 1); },

    DEC: function (addr) { this._xcrement_memory(addr, -1); },
    INC: function (addr) { this._xcrement_memory(addr, 1); },

    AND: function (value) {
        var result = (this._getRegister(this.REGISTERS.A) & value);
        this._setRegister(this.REGISTERS.A, result)
            ._setFlagsFromValue(result);
    },
    EOR: function (value) {
        var result = (this._getRegister(this.REGISTERS.A) ^ value);
        this._setRegister(this.REGISTERS.A, result)
            ._setFlagsFromValue(result);
    },
    ORA: function (value) {
        var result = (this._getRegister(this.REGISTERS.A) | value);
        this._setRegister(this.REGISTERS.A, result)
            ._setFlagsFromValue(result);
    },

    JMP: function (addr) { this.programCounter = addr; this._advanceCycles(-1); },
    BCC: function (offset) { if (!this.CARRY) this._branch(offset); },
    BCS: function (offset) { if (this.CARRY) this._branch(offset); },
    BEQ: function (offset) { if (this.ZERO) this._branch(offset); },
    BNE: function (offset) { if (!this.ZERO) this._branch(offset); },
    BMI: function (offset) { if (this.NEGATIVE) this._branch(offset); },
    BPL: function (offset) { if (!this.NEGATIVE) this._branch(offset); },
    BVS: function (offset) { if (this.OVERFLOW) this._branch(offset); },
    BVC: function (offset) { if (!this.OVERFLOW) this._branch(offset); },

    CMP: function (value) { this._compare(this.REGISTERS.A, value); },
    CPX: function (value) { this._compare(this.REGISTERS.X, value); },
    CPY: function (value) { this._compare(this.REGISTERS.Y, value); },

    BIT: function (addr) {
        var mem = this._getMemory(addr);
        this.NEGATIVE = Boolean(mem & 0x80);
        this.OVERFLOW = Boolean(mem & 0x40);

        var result = this._getRegister(this.REGISTERS.A) & mem;
        this.ZERO = Boolean(result === 0);
    },

    ASL: function (addr) {
        var value = (addr === undefined) ? this._getRegister(this.REGISTERS.A) : this._getMemory(addr);
        this.CARRY = Boolean(value & 0x80);
        value <<= 1;
        (addr === undefined) ? this._setRegister(this.REGISTERS.A, value) : this._setMemory(addr, value);
        this._setFlagsFromValue(value);
        if (addr !== undefined) this._advanceCycles(2);
    },
    LSR: function (addr) {
        var value = (addr === undefined) ? this._getRegister(this.REGISTERS.A) : this._getMemory(addr);
        this.CARRY = Boolean(value & 0x01);
        value >>= 1;
        (addr === undefined) ? this._setRegister(this.REGISTERS.A, value) : this._setMemory(addr, value);
        this._setFlagsFromValue(value);
        if (addr !== undefined) this._advanceCycles(2);
    },
    ROL: function (addr) {
        var value = (addr === undefined) ? this._getRegister(this.REGISTERS.A) : this._getMemory(addr),
            oldCarry = this.CARRY;
        this.CARRY = Boolean(value & 0x80);
        value <<= 1;
        value |= (oldCarry ? 1 : 0);
        (addr === undefined) ? this._setRegister(this.REGISTERS.A, value) : this._setMemory(addr, value);
        this._setFlagsFromValue(value);
        if (addr !== undefined) this._advanceCycles(2);
    },
    ROR: function (addr) {
        var value = (addr === undefined) ? this._getRegister(this.REGISTERS.A) : this._getMemory(addr),
            oldCarry = this.CARRY;
        this.CARRY = Boolean(value & 0x01);
        value >>= 1;
        value |= (oldCarry ? 0x80 : 0);
        (addr === undefined) ? this._setRegister(this.REGISTERS.A, value) : this._setMemory(addr, value);
        this._setFlagsFromValue(value);
        if (addr !== undefined) this._advanceCycles(2);
    },

    TAX: function () { this
        ._setRegister(this.REGISTERS.X, this._getRegister(this.REGISTERS.A))
        ._setFlagsFromRegister(this.REGISTERS.X); },
    TAY: function () { this
        ._setRegister(this.REGISTERS.Y, this._getRegister(this.REGISTERS.A))
        ._setFlagsFromRegister(this.REGISTERS.Y); },
    TSX: function () { this
        ._setRegister(this.REGISTERS.X, this.stackPointer)
        ._setFlagsFromRegister(this.REGISTERS.X); },
    TXA: function () { this
        ._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.X))
        ._setFlagsFromRegister(this.REGISTERS.A); },
    TXS: function () { this.stackPointer = this
        ._setFlagsFromRegister(this.REGISTERS.X)
        ._getRegister(this.REGISTERS.X); },
    TYA: function () { this
        ._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.Y))
        ._setFlagsFromRegister(this.REGISTERS.A); },

    NOP: function () {},

    PHA: function () { this._advanceCycles(1).pushStack(this._getRegister(this.REGISTERS.A)); },
    PLA: function () { this
        ._advanceCycles(2)
        ._setRegister(this.popStack())
        ._setFlagsFromRegister(this.REGISTERS.A);
    },
    PHP: function () { this._advanceCycles(1).pushStack(this._getPS() | 48); },
    PLP: function () { this._advanceCycles(2)._setPS(this.popStack()); },

    JSR: function (addr) {
        var returnAddress = this.programCounter - 1;
        this._advanceCycles(2)
            .pushStack((returnAddress & 0xFF00) >> 8)
            .pushStack(returnAddress & 0x00FF);
        this.programCounter = addr;
    },
    RTS: function () {
        this._advanceCycles(4);
        this.programCounter = (this.popStack() | (this.popStack() << 8)) + 1;
    },
    RTI: function () {
        this._setPS(this.popStack())._advanceCycles(4);
        this.programCounter = (this.popStack() | (this.popStack() << 8));
    },

    BRK: function () {
        //this.BREAK = true;
        this.IRQ_DISABLE = true;
        this._advanceCycles(5);
        this.programCounter++;
        this.callInterrupt(0xFFFE);
    },

    fetchByte: function () { return this._getMemory(this.programCounter++); },
    fetchShort: function () { return this.fetchByte() | (this.fetchByte() << 8); },

    callInterrupt: function (addr) {
        this.pushStack((this.programCounter & 0xFF00) >> 8);
        this.pushStack(this.programCounter & 0x00FF);
        this.pushStack(this._getPS() | (addr === 0xFFFE ? 48 : 32));
        this.programCounter = this._getMemory_16Bit(addr);
    },
    IRQ: function (non_maskable) {
        if (!this.IRQ_DISABLE || non_maskable) {
            this.callInterrupt(non_maskable ? 0xFFFA : 0xFFFE);
            this.IRQ_DISABLE = true;
        }
    },

    ADDRESSING_MODES: {
        IMPLIED: 0,
        ACCUMULATOR: 0, // on purpose
        ABSOLUTE: 1,
        ABSOLUTE_X: 2,
        ABSOLUTE_Y: 3,
        IMMEDIATE: 4,
        RELATIVE: 4, // on purpose
        INDIRECT: 5,
        X_INDIRECT: 6,
        INDIRECT_Y: 7,
        ZEROPAGE: 8,
        ZEROPAGE_X: 9,
        ZEROPAGE_Y: 10
    },
    VALUE_MODES: {
        ADDRESS: 0,
        VALUE: 1
    },

    /* hard coded instruction table
    instructionTable: [
        //   x0           x1           x2           x3           x4           x5           x6           x7           x8           x9           xA           xB           xC           xD           xE           xF
        ['BRK', 0,1],['ORA', 6,1],            ,            ,            ,['ORA', 8,1],['ASL', 8,0],            ,['PHP', 0,1],['ORA', 4,1],['ASL', 0,1],            ,            ,['ORA', 1,1],['ASL', 1,0],            , // 0x
        ['BPL', 4,1],['ORA', 7,1],            ,            ,            ,['ORA', 9,1],['ASL', 9,0],            ,['CLC', 0,1],['ORA', 3,1],            ,            ,            ,['ORA', 2,1],['ASL', 2,0],            , // 1x
        ['JSR', 1,0],['AND', 6,1],            ,            ,['BIT', 8,0],['AND', 8,1],['ROL', 8,0],            ,['PLP', 0,1],['AND', 4,1],['ROL', 0,1],            ,['BIT', 1,0],['AND', 1,1],['ROL', 1,0],            , // 2x
        ['BMI', 4,1],['AND', 7,1],            ,            ,            ,['AND', 9,1],['ROL', 9,0],            ,['SEC', 0,1],['AND', 3,1],            ,            ,            ,['AND', 2,1],['ROL', 2,0],            , // 3x
        ['RTI', 0,1],['EOR', 6,1],            ,            ,            ,['EOR', 8,1],['LSR', 8,0],            ,['PHA', 0,1],['EOR', 4,1],['LSR', 0,1],            ,['JMP', 1,0],['EOR', 1,1],['LSR', 1,0],            , // 4x
        ['BVC', 4,1],['EOR', 7,1],            ,            ,            ,['EOR', 9,1],['LSR', 9,0],            ,['CLI', 0,1],['EOR', 3,1],            ,            ,            ,['EOR', 2,1],['LSR', 2,0],            , // 5x
        ['RTS', 0,1],['ADC', 6,1],            ,            ,            ,['ADC', 8,1],['ROR', 8,0],            ,['PLA', 0,1],['ADC', 4,1],['ROR', 0,1],            ,['JMP', 5,0],['ADC', 1,1],['ROR', 1,0],            , // 6x
        ['BVS', 4,1],['ADC', 7,1],            ,            ,            ,['ADC', 9,1],['ROR', 9,0],            ,['SEI', 0,1],['ADC', 3,1],            ,            ,            ,['ADC', 2,1],['ROR', 2,0],            , // 7x
                    ,['STA', 6,0],            ,            ,['STY', 8,0],['STA', 8,0],['STX', 8,0],            ,['DEY', 0,1],['STA', 4,0],['TXA', 0,1],            ,['STY', 1,0],['STA', 1,0],['STX', 1,0],            , // 8x
        ['BCC', 4,1],['STA', 7,0],            ,            ,['STY', 9,0],['STA', 9,0],['STX',10,0],            ,['TYA', 0,1],['STA', 3,0],['TXS', 0,1],            ,            ,['STA', 2,0],            ,            , // 9x
        ['LDY', 4,1],['LDA', 6,1],['LDX', 4,1],            ,['LDY', 8,1],['LDA', 8,1],['LDX', 8,1],            ,['TAY', 0,1],['LDA', 4,1],['TAX', 0,1],            ,['LDY', 1,1],['LDA', 1,1],['LDX', 1,1],            , // Ax
        ['BCS', 4,1],['LDA', 7,1],            ,            ,['LDY', 9,1],['LDA', 9,1],['LDX',10,1],            ,['CLV', 0,1],['LDA', 3,1],['TSX', 0,1],            ,['LDY', 2,1],['LDA', 2,1],['LDX', 3,1],            , // Bx
        ['CPY', 4,1],['CMP', 6,1],            ,            ,['CPY', 8,1],['CMP', 8,1],['DEC', 8,0],            ,['INY', 0,1],['CMP', 4,1],['DEX', 0,1],            ,['CPY', 1,1],['CMP', 1,1],['DEC', 1,0],            , // Cx
        ['BNE', 4,1],['CMP', 7,1],            ,            ,            ,['CMP', 9,1],['DEC', 9,0],            ,['CLD', 0,1],['CMP', 3,1],            ,            ,            ,['CMP', 2,1],['DEC', 2,0],            , // Dx
        ['CPX', 4,1],['SBC', 6,1],            ,            ,['CPX', 8,1],['SBC', 8,1],['INC', 8,0],            ,['INX', 0,1],['SBC', 4,1],['NOP', 0,1],            ,['CPX', 1,1],['SBC', 1,1],['INC', 1,0],            , // Ex
        ['BEQ', 4,1],['SBC', 7,1],            ,            ,            ,['SBC', 9,1],['INC', 9,0],            ,['SED', 0,1],['SBC', 3,1],            ,            ,            ,['SBC', 2,1],['INC', 2,0],              // Fx
    ],
    prepareTable: function () {}, /**/

    /* calculated instruction table */
    instructionTable: [],
    prepareTable: function () {
        var op = 0,
            self = this,
            INSTRUCTION_GROUP_1 = "ORA|AND|EOR|ADC|STA|LDA|CMP|SBC".split("|"),
            INSTRUCTION_GROUP_2 = "ASL|ROL|LSR|ROR|STX|LDX|DEC|INC".split("|"),
            IMPLIED_GROUP       = "PHP|CLC|PLP|SEC|PHA|CLI|PLA|SEI|DEY|TYA|TAY|CLV|INY|CLD|INX|SED".split("|"),
            BRANCH_GROUP        = "BPL|BMI|BVC|BVS|BCC|BCS|BNE|BEQ".split("|"),

            ADDRESS_OPCODES     = "STA|STX|STY|DEC|INC|JMP|BIT|ASL|LSR|ROL|ROR|JSR".split("|");
        
        function _(code, addr_mode) {
            var entry = [code];
            if (addr_mode) {
                entry.push(addr_mode);
                
                if (ADDRESS_OPCODES.indexOf(code) !== -1)
                    entry.push(self.VALUE_MODES.ADDRESS);
                else entry.push(self.VALUE_MODES.VALUE);
                
            } else entry.push(self.ADDRESSING_MODES.IMPLIED, self.VALUE_MODES.VALUE);

            self.instructionTable[op] = entry;
        }

        for (;op < 256; op++) {
            var lo = op & 0x0F,
                hi = (op & 0xF0) >> 4;
            with (this.ADDRESSING_MODES) switch (lo) {
                case 0x0:
                    if (hi % 2 == 1) {
                        _(BRANCH_GROUP[Math.floor(hi / 2)], RELATIVE);
                    } else switch (hi) {
                        case 0x0: _("BRK");            break;
                        case 0x2: _("JSR", ABSOLUTE);  break;
                        case 0x4: _("RTI");            break;
                        case 0x6: _("RTS");            break;

                        case 0xA: _("LDY", IMMEDIATE); break;
                        case 0xC: _("CPY", IMMEDIATE); break;
                        case 0xE: _("CPX", IMMEDIATE); break;
                    } break;

                case 0x1: _(INSTRUCTION_GROUP_1[Math.floor(hi/2)],
                        hi % 2 ? INDIRECT_Y : X_INDIRECT); break;

                case 0x2: if (hi === 0xA) _("LDX", IMMEDIATE); break;
                case 0x3: break;
                case 0x4: switch (hi) {
                    case 0x2: _("BIT", ZEROPAGE); break;

                    case 0x8: _("STY", ZEROPAGE); break;
                    case 0x9: _("STY", ZEROPAGE_X); break;
                    case 0xA: _("LDY", ZEROPAGE); break;
                    case 0xB: _("LDY", ZEROPAGE_X); break;

                    case 0xC: _("CPY", ZEROPAGE); break;
                    case 0xE: _("CPX", ZEROPAGE); break;
                } break;

                case 0x5: _(INSTRUCTION_GROUP_1[Math.floor(hi/2)],
                        hi % 2 ? ZEROPAGE_X : ZEROPAGE); break;

                case 0x6: switch (hi) {
                    case 0x9: _("STX", ZEROPAGE_Y); break;
                    case 0xB: _("LDX", ZEROPAGE_Y); break;
                    default: _(INSTRUCTION_GROUP_2[Math.floor(hi/2)],
                        hi % 2 ? ZEROPAGE_X : ZEROPAGE); break;
                } break;

                case 0x8: _(IMPLIED_GROUP[hi]); break;

                case 0x9: switch (hi) {
                    case 0x8: break;
                    default: _(INSTRUCTION_GROUP_1[Math.floor(hi/2)],
                        hi % 2 ? ABSOLUTE_Y : IMMEDIATE); break;
                } break;

                case 0xA: switch (hi) {
                    case 0x0: _("ASL", ACCUMULATOR); break;
                    case 0x2: _("ROL", ACCUMULATOR); break;
                    case 0x4: _("LSR", ACCUMULATOR); break;
                    case 0x6: _("ROR", ACCUMULATOR); break;

                    case 0x8: _("TXA"); break;
                    case 0x9: _("TXS"); break;
                    case 0xA: _("TAX"); break;
                    case 0xB: _("TSX"); break;
                    case 0xC: _("DEX"); break;
                    case 0xE: _("NOP"); break;
                } break;

                case 0xC: switch (hi) {
                    case 0x2: _("BIT", ABSOLUTE); break;

                    case 0x4: _("JMP", ABSOLUTE); break;
                    case 0x6: _("JMP", INDIRECT); break;

                    case 0x8: _("STY", ABSOLUTE); break;
                    case 0xA: _("LDY", ABSOLUTE); break;
                    case 0xB: _("LDY", ABSOLUTE_X); break;

                    case 0xC: _("CPY", ABSOLUTE); break;
                    case 0xE: _("CPX", ABSOLUTE); break;
                } break;

                case 0xD: _(INSTRUCTION_GROUP_1[Math.floor(hi/2)],
                        hi % 2 ? ABSOLUTE_X : ABSOLUTE); break;

                case 0xE: switch (hi) {
                    case 0x9: break;
                    case 0xB: _("LDX", ABSOLUTE_Y); break;
                    default: _(INSTRUCTION_GROUP_2[Math.floor(hi/2)],
                        hi % 2 ? ABSOLUTE_X : ABSOLUTE); break;
                }
            }
        }
    }, /**/

    nextInstruction: function () {
        var op = this.fetchByte(),
            silent = this.options.ignoreInvalidInstructions,
            ARITHMETIC_GROUP = "ADC|AND|CMP|EOR|LDA|LDX|LDY|ORA|SBC".split("|"),
            self = this;

        if (this.instructionTable[op] !== undefined) with (this.ADDRESSING_MODES) with (this.VALUE_MODES) {
            var entry = this.instructionTable[op],
                x = this._getRegister(this.REGISTERS.X),
                y = this._getRegister(this.REGISTERS.Y),
                code = entry[0],
                addr_mode = entry[1],
                value_mode = entry[2],
                addr = 0x0;

            if (addr_mode === IMPLIED) this[code]();
            else if (addr_mode === IMMEDIATE) {
                if (value_mode === ADDRESS && !silent) throw new Error("Invalid MOS6502 instruction!");
                else this[code](this.fetchByte());
            }
            else {

                // Shortcut for advancing cycles for precision timing.
                function _(n) { return self._advanceCycles(n); }

                // When using absolute/indirect indexed addressing, the CPU takes an extra cycle to complete the
                // instruction. However, the exception to this rule is if the instruction is an "arithmetic"
                // instruction and the index doesn't cause the target address to be on another page
                // (e.g. when X = Y = 0xF, $00F0 = $44F5; [ADC $44F5,X], [STA $44F5,X], [STA $4480,X], [ADC ($F5),Y]
                // take an extra cycle; [ADC $4480,X], doesn't).

                // Adds n to addr, then checks if it crossed a page boundary or if it's a "force page boundary" op.
                // If so, increment by one cycle.
                function bound(n) {
                    if ((addr ^ (addr += n)) & 0x100 ||
                        ARITHMETIC_GROUP.indexOf(code) === -1) _(1);
                }

                switch (addr_mode) {
                    case ABSOLUTE: addr = _(2).fetchShort(); break;
                    case ZEROPAGE: addr = _(1).fetchByte(); break;
                    case INDIRECT: addr = _(4)._getMemory_16Bit(this.fetchShort()); break;
                    case ABSOLUTE_X: addr = _(2).fetchShort(); bound(x); break;
                    case ABSOLUTE_Y: addr = _(2).fetchShort(); bound(y); break;
                    case ZEROPAGE_X: addr = (_(2).fetchByte() + x) % 0xFF; break;
                    case ZEROPAGE_Y: addr = (_(2).fetchByte() + y) % 0xFF; break;
                    case X_INDIRECT: addr = _(4)._getMemory_16Bit((this.fetchByte() + x) % 0xFF); break;
                    case INDIRECT_Y: addr = _(3)._getMemory_16Bit(this.fetchByte()); bound(y); addr %= 0xFF; break;
                }
                this[code](value_mode === VALUE ? this._getMemory_16Bit(addr) : addr);
            }

            // All operations take at least 2 cycles to run: for many implied/immediate instructions, they only take 2
            // cycles, so I decided to use the "lowest common denominator" approach and accumulate cycles across
            // multiple points in the code (helper functions, individual operations, addressing modes)
            this.cycles += 2;

        } else if (!silent) throw new Error("Invalid MOS6502 instruction!");
    },

    runFrame: function () {
        for (var i=0;i<this.clockSpeed/this.frameRate;i++)
            this.nextInstruction();
    }

};

function NES() {
    this._memoryView = new ArrayBuffer(65536);
    this.memory = new Uint8Array(this._memoryView);
    this.cpu = new NES.CPU(this);
    this.ppu = new NES.PPU(this);
    this.cartridge = new NES.Cartridge(0);
}
NES.prototype = {
    constructor: NES,
    clockSpeed: 21477272,

    _getMemory: function (addr) {
        addr &= 0xFFFF;
        switch (true) {
            case addr < 0x2000:
                return this.memory[addr % 0x0800];
            case addr < 0x4000:
                return this.ppu._getRegister((addr - 0x2000) % 8);
            case addr < 0x4020:
                return this.memory[addr];
            case addr < 0xFFFA:
                return this.cartridge._getMemory(addr);
            case addr < 0x10000:
                return this.cpu.interruptVectors[addr - 0xFFFA];
            default:
                return 0;
        }
    },
    _setMemory: function (addr, value) {
        addr &= 0xFFFF;
        value &= 0xFF;
        switch (true) {
            case addr < 0x2000:
                this.memory[addr % 0x0800] = value;
                break;
            case addr < 0x4000:
                this.ppu._setRegister((addr - 0x2000) % 8, value);
                break;
            case addr < 0x4020:
                this.memory[addr] = value;
                break;
            case addr < 0xFFFA:
                this.cartridge._setMemory(addr, value);
                break;
            case addr < 0x10000:
                this.cpu.interruptVectors[addr - 0xFFFA] = value;
                break;
        }
    },

    run: function () {

    }
};

var MIRROR_MODES = {
    VERTICAL: 0,
    HORIZONTAL: 1,
    MONO: 2,
    FOUR: 3
};


NES.CPU = function (nes) {
    MOS6502.call(this);
    this.nes = nes;
    this.clockSpeed = Math.floor(nes.clockSpeed / 12);
    this.options.disableDecimal = true;
};
NES.CPU.prototype = Object.create(MOS6502.prototype);
NES.CPU.prototype.constructor = NES.CPU;
NES.CPU.prototype.clockSpeed = 1789773; // NTSC
NES.CPU.prototype._getMemory = function (addr) {
    var invalid = false;
    [0x2000,0x2001,0x2003,0x2005,0x2006,0x4014].forEach(function (e) {
        if (addr === e) invalid = true;
    });
    if (invalid) return 0;

    return this.nes._getMemory(addr);
};
NES.CPU.prototype._setMemory = function (addr, value) {
    var invalid = false;
    [0x2002].forEach(function (e) {
        if (addr === e) invalid = true;
    });
    if (invalid) return;

    this.nes._setMemory(addr, value);
};

/**
 * Class for abstracting the NES Picture Processing Unit's tasks and abilities.
 *
 * Portions derived from bnes - a part of the Higan project (formerly bsnes)
 *   (C) byuu, Ryphecha 2011
 *   under the GNU GPLv3
 *
 * @param nes The NES object to bind to.
 * @constructor
 */
NES.PPU = function (nes) {
    var self = this;

    this.nes = nes;
    this.clockSpeed = Math.floor(nes.clockSpeed / 4);
    this.memory = new Uint8Array(0x1000);
    this.palette = new Uint8Array(32);
    this.oam = new Uint8Array(256);

    function define8Bit(name) {
        var hold = new Uint8Array(1);
        Object.defineProperty(this, name, {
            get: function () { return hold[0]; },
            set: function (v) { hold[0] = v; }
        });
    }
    function define16Bit(name) {

    }

    var byteprops = ["mdr", "lx", "ly", "bus_data", "fine_x", "oam_addr"];
    var bytehold = new Uint8Array(byteprops.length);
    byteprops.forEach(function (e, i) {
        Object.defineProperty(self, e, {
            get: function () { return bytehold[i]; },
            set: function (v) { bytehold[i] = v; }
        });
    });

    var wordprops = ["vram_addr", "temp_vram"];
    var wordhold = new Uint16Array(wordprops.length);
    wordprops.forEach(function (e, i) {
        Object.defineProperty(self, e, {
            get: function () { return wordhold[i]; },
            set: function (v) { wordhold[i] = v; }
        });
    });

    this.sprite_overflow = true;
    this.vblank_flag = true;
};
NES.PPU.prototype = {
    constructor: NES.PPU,

    clockSpeed: 21477272/4,
    cycles: 0,
    total_cycles: 0,

    REGISTERS: {
        PPUCTRL: 0,
        PPUMASK: 1,
        PPUSTATUS: 2,
        OAMADDR: 3,
        OAMDATA: 4,
        PPUSCROLL: 5,
        PPUADDR: 6,
        PPUDATA: 7
    },
    memory: [],
    palette: [],
    oam: [],

    oddFrame: false,

    reset: function () {

    },

    mdr: 0,
    lx: 0,
    ly: 0,

    bus_data: 0,

    address_latch: false,

    vram_addr: 0x0,
    temp_vram: 0x0,
    fine_x: 0,
    oam_addr: 0x0,

    nmi_hold: false,
    vblank_flag: false,

    nmi_enable: false,
    master_select: false,
    sprite_height: false,
    background_tile: false,
    sprite_tile: false,
    increment_mode: false,
    nametable_select: 0,

    sprite_zero_hit: false,
    sprite_overflow: false,

    grayscale: false,
    background_margin: false,
    sprite_margin: false,
    show_background: false,
    show_sprites: false,
    emphasis: 0,

    _getRegister: function (reg) {
        switch (reg) {
            case this.REGISTERS.PPUSTATUS:
                var result = (
                    (this.vblank_flag     << 7) |
                    (this.sprite_zero_hit << 6) |
                    (this.sprite_overflow << 5) |
                    (this.bus_data      & 0x1f)
                );
                this.vblank_flag = false;
                this.address_latch = false;
                return result;
        }
    },
    _setRegister: function (reg, value) {
        switch (reg) {
            case this.REGISTERS.PPUCTRL:
                if (this.total_cycles > 30000) {
                    this.nametable_select = value & 0x3;
                    this.increment_mode = Boolean(value & 0x4);
                    this.sprite_tile = Boolean(value & 0x8);
                    this.background_tile = Boolean(value & 0x10);
                    this.sprite_height = Boolean(value & 0x20);
                    this.master_select = Boolean(value & 0x40);
                    this.nmi_enable = Boolean(value & 0x80);

                    if (this.vblank_flag)
                        this.nes.cpu.IRQ(true);
                }
                break;
            case this.REGISTERS.PPUMASK:
                this.grayscale = Boolean(value & 0x1);
                this.background_margin = Boolean(value & 0x2);
                this.sprite_margin = Boolean(value & 0x4);
                this.show_background = Boolean(value & 0x8);
                this.show_sprites = Boolean(value & 0x10);
                this.emphasis = (value & 0xE0) >> 5;
                break;
            case this.REGISTERS.OAMADDR:
                this.oam_addr = value;
                break;
            case this.REGISTERS.OAMDATA:
                this.oam[this.oam_addr++] = value;
                break;
            case this.REGISTERS.PPUSCROLL:
                if (this.address_latch) {
                    this.temp_vram = (this.temp_vram & 0x0c1f) | ((value & 0x07) << 12) | ((value >> 3) << 5);
                } else {
                    this.fine_x = value & 0x07;
                    this.temp_vram = (this.temp_vram & 0x7fe0) | (value >> 3);
                }
                break;
            case this.REGISTERS.PPUDATA:

        }
        this.bus_data = value;
    },

    _getMemory: function (addr) {
        switch (true) {
            case addr < 0x2000:
                return this.nes.cartridge.getMemory_PPU(addr);
            case addr < 0x3F00:
                var ntaddr = (addr - 0x2000) % 0x1000;
                switch (this.nes.cartridge.mirroring) {
                    case MIRROR_MODES.VERTICAL: switch (true) {
                        case addr < 0x2400:
                        case addr < 0x2800:
                            break;

                        case addr < 0x2C00:
                        case addr < 0x3000:
                            ntaddr -= 0x800;
                            break;
                    } break;
                    case MIRROR_MODES.HORIZONTAL: switch (true) {
                        case addr < 0x2400:
                            break;

                        case addr < 0x2800:
                        case addr < 0x2C00:
                            ntaddr -= 0x400;
                            break;

                        case addr < 0x3000:
                            ntaddr -= 0x800;
                            break;
                    } break;
                    case MIRROR_MODES.MONO:
                        ntaddr %= 0x400;
                        break;
                    case MIRROR_MODES.FOUR:
                        break;
                }

                if (this.nes.cartridge._providesNametable(addr))
                    return this.nes.cartridge.getMemory_PPU(ntaddr + 0x2000);
                else
                    return this.memory[ntaddr];
                break;
            case addr < 0x4000:
                return this.memory[(addr - 0x3F00) % 0x0020];
        }
    },
    _setMemory: function (addr, value) {
        switch (true) {
            case addr < 0x2000:
                break;
            case addr < 0x3F00:
                if (this.nes.cartridge._providesNametable(addr))
                    this.nes.cartridge.setMemory_PPU(((addr - 0x2000) % 0x1000) + 0x2000);
                else
                    this.memory[(addr - 0x2000) % 0x1000] = value;
                break;
        }
    },

    tick: function () {}
};

NES.APU = function (nes) {
    this.nes = nes;
    this.registers = new Uint8Array(nes._memoryView, 0x4000, 32);
};

NES.Cartridge = function (mapping) {
    this.id = mapping.id;
    this.mirroring = mapping.mirroring;

    switch (this.id) {
        case 0:
            this.prg_rom = new Uint8Array(0x2000);
            this.chr_rom = new Uint8Array(0x2000);
            break;

    }
};
NES.Cartridge.prototype = {
    constructor: NES.Cartridge,

    getMemory_CPU: function (addr) {
        switch (this.id) {
            case 0: switch (true) {
                case addr < 0x8000:
                    return 0;
                case addr < 0x10000:
                    return this.prg_rom[(addr - 0x8000) % 0x2000];
            } break;
            default:
                return 0;
        }
    },
    setMemory_CPU: function (addr, value) {
        switch (this.id) {
            case 0:
                break;
            default:
                break;
        }
    },
    getMemory_PPU: function (addr) {
        switch (this.id) {
            case 0:
                return this.chr_rom[addr % 0x2000];
            default:
                return 0;
        }
    },
    setMemory_PPU: function (addr, value) {
        switch (this.id) {
            case 0:
                this.chr_rom[addr % 0x2000] = value;
                break;
            default:
                break;
        }
    },
    _providesNametable: function (addr) {
        var internallyMapped = [0];
        return internallyMapped.indexOf(this.id) === -1;
    }
};

var cpu;
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    $(document).on("pageload", function () {
        cpu = new MOS6502();
    });
});
});
