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


function uiNewFeedItem(msg) {
    $(".feed").append("<li>"+msg+"</li>");
    while ($(".feed li").length > 200) $(".feed li")[0].remove();
}

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
        disableDecimal: false,
        indirectJumpBug: true
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
    nmi_high: false,

    _getRegister: function (reg) {
        return this.registers[reg];
    },
    _setRegister: function (reg, value) {
        this.registers[reg] = value;
        return this;
    },
    _setOverflow: function (value1, value2) {
        var s1 = value1 & 0x80,
            s2 = value2 & 0x80,
            s3 = ((value1 + value2) & 0xFF) & 0x80;

        this.OVERFLOW = Boolean((s1 == s2) && (s3 != s1));
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
            case addr < 0x10000:
                return this.memory[addr];
            default:
                return 0;
        }
    },
    _setMemory: function (addr, value) {
        switch (true) {
            case addr < 0x10000:
                this.memory[addr] = value;
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
            ._setFlagsFromValue(this._getRegister(reg));
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
            ._setFlagsFromValue(result)
            ._setMemory(addr, result);
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
    total_cycles: 0,
    clockSpeed: 1790000,
    frameRate: 30,
    _advanceCycles: function (n) { this.cycles += n; this.total_cycles += n; return this; },

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

            this._setOverflow(a, value);
        }
        this._setAccumulatorWithFlags(result);
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
        ._setRegister(this.REGISTERS.A, this.popStack())
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

    disassemble: function (addr) {
        addr = addr || this.programCounter;
        var str = [],
            self = this,
            op = this._getMemory(addr),
            inst = this.instructionTable[op] || ["???", 0, 1],
            ADDR = this.ADDRESSING_MODES,
            prefix = function (s,n,c) { s = s.toString(); while (s.length < n) s = (c||"0") + s; return s; },
            postfix = function (s,n,c) { s = s.toString(); while (s.length < n) s += (c||" "); return s; },
            h = function (x,n) { return prefix(x.toString(16), n||2, "0"); },
            getbyte = function () { return self._getMemory(addr+1); },
            getaddr = function () { return self._getMemory_16Bit(addr+1); };

        str.push(h(addr, 4));

        var listing = [];
        listing.push(h(op));
        if (inst[1] !== 0) listing.push(h(this._getMemory(addr+1)));
        if ([1,2,3,5].indexOf(inst[1]) !== -1)
            listing.push(h(this._getMemory(addr+2)));

        str.push(postfix(listing.join(" "), 9, " "));
        str.push(prefix(inst[0], 3, " "));

        switch (inst[1]) {
            case ADDR.ABSOLUTE:   str.push("$" +  h(getaddr(), 4));         break;
            case ADDR.ABSOLUTE_X: str.push("$" +  h(getaddr(), 4) + ",X");  break;
            case ADDR.ABSOLUTE_Y: str.push("$" +  h(getaddr(), 4) + ",Y");  break;
            case ADDR.INDIRECT:   str.push("($" + h(getaddr(), 4) + ")");   break;
            case ADDR.X_INDIRECT: str.push("($" + h(getbyte())    + ",X)"); break;
            case ADDR.INDIRECT_Y: str.push("($" + h(getbyte())    + "),Y"); break;
            case ADDR.ZEROPAGE:   str.push("$" +  h(getbyte()));            break;
            case ADDR.ZEROPAGE_X: str.push("$" +  h(getbyte())    + ",X");  break;
            case ADDR.ZEROPAGE_Y: str.push("$" +  h(getbyte())    + ",Y");  break;

            case ADDR.IMMEDIATE:
            case ADDR.RELATIVE:
                if (inst[0][0] == "B") { // branch instruction
                    var offset = getbyte(),
                        delta = 0;
                    if (offset & 0x80) delta = -(-offset & 0xFF);
                    else delta = offset & 0xFF;

                    str.push("$" + h(addr + 2 + delta, 4));
                } else str.push("#$" + h(getbyte()));
                break;

            case ADDR.IMPLIED:
            case ADDR.ACCUMULATOR:
            default:
                break;
        }

        var inst_str = str.join(" ");
        inst_str += prefix("", 48 - inst_str.length, " ");
        inst_str += "A:" + h(self._getRegister(self.REGISTERS.A));
        inst_str += " X:" + h(self._getRegister(self.REGISTERS.X));
        inst_str += " Y:" + h(self._getRegister(self.REGISTERS.Y));
        inst_str += " P:" + h(self._getPS());
        inst_str += " SP:" + h(self.stackPointer);
        inst_str += " CYC:" + prefix(self.cycles % 341, 3, " ");
        inst_str += " SL:" + prefix((Math.floor(self.cycles / 341) + 242) % 262 - 1, 3, " ");

        return inst_str.toUpperCase();
    },

    ARITHMETIC_GROUP: ["ADC","AND","CMP","EOR","LDA","LDX","LDY","ORA","SBC"],

    nextInstruction: (function () {
        var self, addr, code;

        // Shortcut for advancing cycles for precision timing.
        function _(n) {
            return self._advanceCycles(n);
        }

        // When using absolute/indirect indexed addressing, the CPU takes an extra cycle to complete the
        // instruction. However, the exception to this rule is if the instruction is an "arithmetic"
        // instruction and the index doesn't cause the target address to be on another page
        // (e.g. when X = Y = 0xF, $00F0 = $44F5; [ADC $44F5,X], [STA $44F5,X], [STA $4480,X], [ADC ($F5),Y]
        // take an extra cycle; [ADC $4480,X], doesn't).

        // Adds n to addr, then checks if it crossed a page boundary or if it's a "force page boundary" op.
        // If so, increment by one cycle.
        function bound(n) {
            if ((addr ^ (addr += n)) & 0x100 ||
                self.ARITHMETIC_GROUP.indexOf(code) === -1) _(1);
        }

        function getIndirectAddress() {
            var addr = _(4).fetchShort();
            if (addr & 0xFF == 0xFF && self.options.indirectJumpBug) {
                var lo = self._getMemory(addr),
                    hi = self._getMemory(addr - 0xFF);
                return (hi << 8) | lo;
            } else return self._getMemory_16Bit(addr);
        }

        return function () {
            //uiNewFeedItem("<pre><code>"+this.disassemble()+"</code></pre>");
            var op = this.fetchByte(),
                silent = this.options.ignoreInvalidInstructions,
                ADDR = this.ADDRESSING_MODES,
                VAL = this.VALUE_MODES,
                entry = this.instructionTable[op];
            self = this;
            addr = 0;

            if (entry !== undefined) {
                var x = this._getRegister(this.REGISTERS.X),
                    y = this._getRegister(this.REGISTERS.Y),
                    addr_mode = entry[1],
                    value_mode = entry[2];
                code = entry[0];

                if (addr_mode === ADDR.IMPLIED) this[code]();
                else if (addr_mode === ADDR.IMMEDIATE) {
                    if (value_mode === VAL.ADDRESS && !silent) throw new Error("Invalid MOS6502 instruction!");
                    else this[code](this.fetchByte());
                } else {
                    switch (addr_mode) {
                        case ADDR.ABSOLUTE: addr = _(2).fetchShort(); break;
                        case ADDR.ZEROPAGE: addr = _(1).fetchByte(); break;
                        case ADDR.INDIRECT: addr = getIndirectAddress(); break;
                        case ADDR.ABSOLUTE_X: addr = _(2).fetchShort(); bound(x); break;
                        case ADDR.ABSOLUTE_Y: addr = _(2).fetchShort(); bound(y); break;
                        case ADDR.ZEROPAGE_X: addr = (_(2).fetchByte() + x) & 0xFF; break;
                        case ADDR.ZEROPAGE_Y: addr = (_(2).fetchByte() + y) & 0xFF; break;
                        case ADDR.X_INDIRECT: addr = _(4)._getMemory_16Bit((this.fetchByte() + x) & 0xFF); break;
                        case ADDR.INDIRECT_Y:
                            addr = _(3)._getMemory_16Bit(this.fetchByte()); bound(y); addr &= 0xFF; break;
                    }
                    this[code](value_mode === VAL.VALUE ? this._getMemory_16Bit(addr) : addr);
                }

                // All operations take at least 2 cycles to run: for many implied/immediate instructions, they only take 2
                // cycles, so I decided to use the "lowest common denominator" approach and accumulate cycles across
                // multiple points in the code (helper functions, individual operations, addressing modes)
                this.cycles += 2;

            } else if (!silent) throw new Error("Invalid MOS6502 instruction!");
        }
    })(),

    runFrame: function () {
        for (var i=0;i<this.clockSpeed/this.frameRate;i++)
            this.nextInstruction();
    }

};

function NES(canvas) {
    this._memoryView = new ArrayBuffer(65536);
    this.memory = new Uint8Array(this._memoryView);
    this.cpu = new NES.CPU(this);
    this.ppu = new NES.PPU(this);

    //var self = this;
    //[0x82,0x80,0x00,0x80,0xF0,0xFF].forEach(function (e, i) {
    //    self._setMemory(0xFFFA + i, e);
    //});

    this.canvas = canvas;
    this.$ = canvas.getContext("2d");
    this.imageData = this.$.createImageData(256, 262);
}
NES.prototype = {
    constructor: NES,
    clockSpeed: 21477272,

    _getMemory: function (addr) {
        addr &= 0xFFFF;
        switch (true) {
            case addr < 0x2000:
                return this.memory[addr & 0x7FF];
            case addr < 0x4000:
                return this.ppu._getRegister((addr - 0x2000) & 7);
            case addr < 0x4020:
                return this.memory[addr];
            case addr < 0x10000:
                return this.cartridge.getMemory_CPU(addr);
            default:
                return 0;
        }
    },
    _setMemory: function (addr, value) {
        addr &= 0xFFFF;
        value &= 0xFF;
        switch (true) {
            case addr < 0x2000:
                this.memory[addr & 0x7FF] = value;
                break;
            case addr < 0x4000:
                this.ppu._setRegister((addr - 0x2000) & 7, value);
                break;
            case addr == 0x4014:
                this.ppu._setRegister(this.ppu.REGISTERS.OAMDMA, value);
                break;
            case addr < 0x4020:
                this.memory[addr] = value;
                break;
            case addr < 0x10000:
                this.cartridge.setMemory_CPU(addr, value);
                break;
        }
    },

    videoUpdate: function () {
        var data = this.imageData.data;
        for (var y = 0; y < 262; y++) {
            for (var x = 0; x < 256; x++) {
                var i = (y * 256 + x) * 4,
                    v = this.ppu.palette[this.ppu.video_buffer[y*256 + x] & 0x3F];
                data[i]     = (v << 16) & 0xFF;
                data[i + 1] = (v <<  8) & 0xFF;
                data[i + 2] = (v)       & 0xFF;
                data[i + 3] = 0xFF;
            }
        }
        this.$.putImageData(this.imageData, 0, 0);

    },

    frame: function () {
        for (var j=0;j<262;j++)
            this.ppu.raster_scanline();

        this.videoUpdate();
    },

    run: function () {

    },

    loadRemoteROM: function (filename, callback) {
        var self = this;

        var req = new XMLHttpRequest();
        req.open("GET", filename, true);
        req.responseType = "arraybuffer";
        req.onload = function (evt) {
            var arrbuf = req.response;
            if (arrbuf) {
                var buf = new Uint8Array(arrbuf);
                function g(b,s,e) {
                    if (e === undefined) { e = s; s = 0; }
                    var sub = b.slice(s,e);
                    for (var i= 0,a=[];i<sub.length;i++)
                        a[i] = sub[i];
                    return a;
                }
                function ascii(a) {
                    return a.map(function (e) {
                        return String.fromCharCode(e)[0];
                    }).join("");
                }

                if (ascii(g(buf, 0, 4)) !== "NES\x1a")
                    throw new Error("Invalid .NES file");

                var pointer = 16,
                    cartspec = { id: 0, mirroring: 0, persistent: false, prg_rom: 0, chr_rom: 0, prg_ram: 0, trainer: true },
                    flags6 = buf[6],
                    flags7 = buf[7];

                cartspec.prg_rom = buf[4] * 16 * 1024;
                cartspec.chr_rom = buf[5] * 8  * 1024;
                cartspec.prg_ram = buf[8] * 8  * 1024;

                if (flags6 & 2) cartspec.persistent = true;
                if (flags6 & 4) cartspec.trainer = true;

                if (flags6 & 8) cartspec.mirroring = MIRROR_MODES.FOUR;
                else if (flags6 & 1) cartspec.mirroring = MIRROR_MODES.VERTICAL;
                else cartspec.mirroring = MIRROR_MODES.HORIZONTAL;

                cartspec.id |= (flags6 >> 4) & 0x0F;
                cartspec.id |= flags7        & 0xF0;

                self.cartridge = new NES.Cartridge(cartspec);

                if (cartspec.trainer && self.cartridge.trainer)
                    self.cartridge.trainer.set(buf.slice(pointer, pointer += 512));

                self.cartridge.prg_rom.set(buf.slice(pointer, pointer += cartspec.prg_rom));
                self.cartridge.chr_rom.set(buf.slice(pointer, pointer += cartspec.chr_rom));

                callback();
            }
        };
        req.send();
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

    //this._setMemory(0xFFFB, 0x80);
    //this._setMemory(0xFFFC, 0x00);
    this.programCounter = 0x8000;
};
NES.CPU.prototype = Object.create(MOS6502.prototype);
NES.CPU.prototype.constructor = NES.CPU;
NES.CPU.prototype.clockSpeed = 1789773; // NTSC
NES.CPU.prototype._getMemory = function (addr) {
    return this.nes._getMemory(addr);
};
NES.CPU.prototype._setMemory = function (addr, value) {
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
    this.oam = new Uint8Array(256);

    this.raster.oam = new Uint8Array(64);
    this.raster.soam = new Uint8Array(64);

    this.video_buffer = new Uint32Array(256 * 262);

    function define8Bit(name) {
        var hold = new Uint8Array(1);
        Object.defineProperty(this, name, {
            get: function () { return hold[0]; },
            set: function (v) { hold[0] = v; }
        });
    }
    function define16Bit(name) {

    }

    var byteprops = ["mdr", "bus_data", "fine_x", "oam_addr"];
    var bytehold = new Uint8Array(byteprops.length);
    byteprops.forEach(function (e, i) {
        var ref = self, a = e.split(".");
        for (var j=0;j<a.length-1;j++) ref = self[a[j]];
        Object.defineProperty(self, e, {
            get: function () { return bytehold[i]; },
            set: function (v) { bytehold[i] = v; }
        });
    });

    var wordprops = ["vram_addr", "temp_vram", "raster.nametable", "raster.attribute", "raster.tiledatalo", "raster.tiledatahi"];
    var wordhold = new Uint16Array(wordprops.length);
    wordprops.forEach(function (e, i) {
        var ref = self, a = e.split(".");
        for (var j=0;j<a.length-1;j++) ref = self[a[j]];
        Object.defineProperty(ref, e, {
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
        PPUDATA: 7,
        OAMDMA: 255
    },
    memory: [],
    oam: [],
    video_buffer: [],

    palette: [
        0x6d6d6d,0x002491,0x0000da,0x6d48da,0x91006d,0xb6006d,0xb62400,0x914800,0x6d4800,0x244800,0x006d24,0x009100,0x004848,0x000000,0x000000,0x000000,
        0xb6b6b6,0x006dda,0x0048ff,0x9100ff,0xb600ff,0xff0091,0xff0000,0xda6d00,0x916d00,0x249100,0x009100,0x00b66d,0x009191,0x000000,0x000000,0x000000,
        0xffffff,0x6db6ff,0x9191ff,0xda6dff,0xff00ff,0xff6dff,0xff9100,0xffb600,0xdada00,0x6dda00,0x00ff00,0x48ffda,0x00ffff,0x000000,0x000000,0x000000,
        0xffffff,0xb6daff,0xdab6ff,0xffb6ff,0xff91ff,0xffb6b6,0xffda91,0xffff48,0xffff6d,0xb6ff48,0x91ff6d,0x48ffda,0x91daff,0x000000,0x000000,0x000000
    ],

    reset: function () {
        this.mdr = this.lx = this.ly = this.vram_addr = this.temp_vram = this.fine_x = this.oam_addr = 0;
        this.vblank_flag = this.oddFrame = this.sprite_zero_hit = this.sprite_overflow = false;
        this.increment_mode = true;
        this._setRegister(this.REGISTERS.PPUCTRL, 0);
        this._setRegister(this.REGISTERS.PPUMASK, 0);

        this.memory.fill(0);
        this.oam.fill(0);
        this.video_buffer.fill(0);
    },

    mdr: 0,
    lx: 0,
    ly: 0,

    bus_data: 0,

    address_latch: false,
    oddFrame: false,

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

    raster: {
        nametable: 0,
        attribute: 0,
        tiledatalo: 0,
        tiledatahi: 0,

        oam_iterator: 0,
        oam_counter: 0,

        oam: [],
        soam: [],

        OAM: {
            ID: 0,
            Y: 1,
            TILE: 2,
            ATTR: 3,
            X: 4,
            TILEDATALO: 6,
            TILEDATAHI: 7
        },
        _get: function (n, prop, oam) { return this[oam||"oam"][n * 8 + prop]; },
        _set: function (n, prop, val, oam) { this[oam||"oam"][n * 8 + prop] = val; }
    },

    _rasterEnabled: function () {
        return (this.show_background || this.show_sprites);
    },

    _getRegister: function (reg) {
        var result = 0;
        switch (reg) {
            case this.REGISTERS.PPUSTATUS:
                result = (
                    (this.vblank_flag     << 7) |
                    (this.sprite_zero_hit << 6) |
                    (this.sprite_overflow << 5) |
                    (this.bus_data      & 0x1f)
                );
                this.nmi_hold = false;
                this.vblank_flag = false;
                this.address_latch = false;
                break;
            case this.REGISTERS.OAMDATA:
                result = this.oam[this.oam_addr];
                if ((this.oam_addr & 3) == 3) result &= 0xe3;
                break;
            case this.REGISTERS.PPUDATA:
                if ((this.show_background || this.show_sprites) && (this.ly <= 240 || this.ly == 261)) return;
                result = this._getMemory(this.vram_addr & 0x3FFF);
                this.vram_addr += (this.increment_mode ? 32 : 1);
                break;
        }
        return result;
    },
    _setRegister: function (reg, value) {
        switch (reg) {
            case this.REGISTERS.PPUCTRL:
                if (this.nes.cpu.total_cycles < 29658)
                    return;
                this.nametable_select = value & 0x3;
                this.increment_mode = Boolean(value & 0x4);
                this.sprite_tile = Boolean(value & 0x8);
                this.background_tile = Boolean(value & 0x10);
                this.sprite_height = Boolean(value & 0x20);
                this.master_select = Boolean(value & 0x40);
                this.nmi_enable = Boolean(value & 0x80);

                if (this.vblank_flag)
                    this.nes.cpu.IRQ(true);
                break;
            case this.REGISTERS.PPUMASK:
                if (this.nes.cpu.total_cycles < 29658)
                    return;
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
                debugger;
                this.oam[this.oam_addr++] = value;
                break;
            case this.REGISTERS.PPUSCROLL:
                if (this.nes.cpu.total_cycles < 29658)
                    return;
                if (this.address_latch) {
                    this.temp_vram = (this.temp_vram & 0x0c1f) | ((value & 0x07) << 12) | ((value >> 3) << 5);
                } else {
                    this.fine_x = value & 0x07;
                    this.temp_vram = (this.temp_vram & 0x7fe0) | (value >> 3);
                }
                this.address_latch = !this.address_latch;
                break;
            case this.REGISTERS.PPUADDR:
                if (this.nes.cpu.total_cycles < 29658)
                    return;
                if (this.address_latch) {
                    this.temp_vram = (this.temp_vram & 0x00ff) | ((value & 0x3f) << 8);
                } else {
                    this.temp_vram = (this.temp_vram & 0x3f00) | value;
                    this.vram_addr = this.temp_vram;
                }
                this.address_latch = !this.address_latch;
                break;
            case this.REGISTERS.PPUDATA:
                debugger;
                if (this._rasterEnabled() && (this.ly <= 240 || this.ly == 261)) return;
                this._setMemory(this.vram_addr & 0x3FFF, value);
                this.vram_addr += (this.increment_mode ? 32 : 1);
                break;
            case this.REGISTERS.OAMDMA:
                var addr = value << 8;
                for (var i=0;i<256;i++) {
                    var j = (this.oam_addr + i) % 256;
                    this.oam[j] = this.nes._getMemory(addr + j);
                }
                this.nes.cpu.cycles += 513 + (this.nes.cpu.cycles % 2);
                break;
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
                return this.memory[(addr - 0x3F00) & 0x1F];
        }
    },
    _setMemory: function (addr, value) {
        switch (true) {
            case addr < 0x2000:
                this.nes.cartridge.setMemory_PPU(addr, value);
                break;
            case addr < 0x3F00:
                if (this.nes.cartridge._providesNametable(addr))
                    this.nes.cartridge.setMemory_PPU(((addr - 0x2000) % 0x1000) + 0x2000);
                else
                    this.memory[(addr - 0x2000) % 0x1000] = value;
                break;
        }
    },

    tick: (function () {
        var self;

        function f(y, x) { return self.lx == x && self.ly == y; }
        function irq() { if (self.nmi_enable && self.vblank_flag) self.nes.cpu.IRQ(true); }

        return function () {
            self = this;

                 if (f(240, 340)) this.nmi_hold = true;
            else if (f(241, 0))   this.vblank_flag = this.nmi_hold;
            else if (f(241, 2))   irq();
            else if (f(260, 340)) this.sprite_zero_hit = this.sprite_overflow = false;
            else if (f(260, 240)) this.nmi_hold = false;
            else if (f(261, 0))   this.vblank_flag = this.nmi_hold;
            else if (f(261, 2))   irq();

            this.total_cycles++;
            this.cycles++;
            this.lx++;

            while (this.cycles * 3 > this.nes.cpu.cycles)
                self.nes.cpu.nextInstruction();
        }
    })(),

    scanline: function () {
        this.lx = 0;
        if (++this.ly == 262) {
            this.ly = 0;
            this.frame();
        }
    },

    frame: function () {
        this.oddFrame = !this.oddFrame;
    },

    _scrollx: function () {
        return ((this.vram_addr & 0x1F) << 3) | this.fine_x;
    },

    _scrollx_inc: function () {
        if (!this._rasterEnabled()) return;
        this.vram_addr = (this.vram_addr & 0x7FE0) | ((this.vram_addr + 1) & 0x001F);
        if ((this.vram_addr & 0x001F) == 0)
            this.vram_addr ^= 0x400;
    },

    _scrolly: function () {
        return (((this.vram_addr >> 5) & 0x1F) << 3) | ((this.vram_addr >> 12) & 7);
    },

    _scrolly_inc: function () {
        if (!this._rasterEnabled()) return;
        this.vram_addr = (this.vram_addr & 0xFFF) | ((this.vram_addr + 1) & 0x7000);
        if ((this.vram_addr & 0x7000) == 0) {
            this.vram_addr = (this.vram_addr & 0x7C1F) | ((this.vram_addr + 0x20) & 0x3E0);
            if ((this.vram_addr & 0x3E0) == 0x3C0) {
                this.vram_addr &= 0x7C1F;
                this.vram_addr ^= 0x800;
            }
        }
    },

    raster_pixel: function () {
        var index = this.ly * 256,
            r = this.raster;

        var mask = 0x8000 >> (this.fine_x + (this.lx & 7)),
            palette = 0, obj_palette = 0,
            obj_priority = false;
        palette |= (r.tiledatalo & mask) ? 1 : 0;
        palette |= (r.tiledatahi & mask) ? 2 : 0;
        if (palette) {
            var attr = this.raster.attribute;
            if (mask >= 256) attr >>= 2;
            palette |= (attr & 3) << 2;
        }

        if (!this.show_background) palette = 0;
        if (!this.background_margin && this.ly < 8) palette = 0;

        if (this.show_sprites) for (var sprite = 7; sprite >= 0; sprite--) {
            if (!this.sprite_margin && this.lx < 8) continue;
            if (r._get(sprite, r.OAM.ID) == 64) continue;

            var spritex = this.lx - r._get(sprite, r.OAM.X);
            if (spritex >= 8) continue;

            if (r._get(sprite, r.OAM.ATTR) & 0x40) spritex ^= 7;
            mask = 0x80 >> spritex;

            var spr_palette = 0;
            spr_palette |= (r._get(sprite, r.OAM.TILEDATALO) & mask) ? 1 : 0;
            spr_palette |= (r._get(sprite, r.OAM.TILEDATAHI) & mask) ? 2 : 0;
            if (spr_palette == 0) continue;

            if (r._get(sprite, r.OAM.ID) == 0 && palette && this.lx != 255)
                this.sprite_zero_hit = true;
            spr_palette |= (r._get(sprite, r.OAM.ATTR) & 3) << 2;

            obj_priority = Boolean(r._get(sprite, r.OAM.ATTR) & 0x20);
            obj_palette = 16 + spr_palette;
        }

        if (obj_palette && (palette == 0 || obj_priority == 0))
            palette = obj_palette;

        if (!this._rasterEnabled()) palette = 0;
        this.video_buffer[index + this.lx] = (this.emphasis << 6) | this._getMemory(0x3F00 + palette);
    },

    raster_sprite: function () {
        var r = this.raster;

        if (!this._rasterEnabled()) return;

        var n = r.oam_iterator++,
            ly = (this.ly == 261 ? -1 : this.ly),
            y = ly - this.oam[n * 4];

        if (y >= (this.sprite_height ? 16 : 8)) return;
        if (r.oam_counter == 8) {
            this.sprite_overflow = true;
            return;
        }

        r._set(r.oam_counter, r.OAM.ID, n);
        r._set(r.oam_counter, r.OAM.Y, this.oam[n * 4]);
        r._set(r.oam_counter, r.OAM.TILE, this.oam[n * 4 + 1]);
        r._set(r.oam_counter, r.OAM.ATTR, this.oam[n * 4 + 2]);
        r._set(r.oam_counter, r.OAM.X, this.oam[n * 4 + 3]);
        r.oam_counter++;
    },

    raster_scanline: function () {
        var self = this,
            nt, tileaddr, attr, tiledatalo, tiledatahi,
            r = self.raster,
            OAM = "oam",
            SOAM = "soam";
        if (this.ly >= 240 && this.ly <= 260) {
            for (var x=0;x<341;x++) this.tick();
            return this.scanline();
        }

        r.oam_iterator = 0;
        r.oam_counter = 0;

        for (var n=0;n<8;n++) {
            r._set(n, r.OAM.ID,         64,   SOAM);
            r._set(n, r.OAM.Y,          0xFF, SOAM);
            r._set(n, r.OAM.TILE,       0xFF, SOAM);
            r._set(n, r.OAM.ATTR,       0xFF, SOAM);
            r._set(n, r.OAM.X,          0xFF, SOAM);
            r._set(n, r.OAM.TILEDATALO, 0,    SOAM);
            r._set(n, r.OAM.TILEDATAHI, 0,    SOAM);
        }

        for (var tile=0;tile<32;tile++) {
            nt = this._getMemory(0x2000 | (this.vram_addr & 0x0FFF));
            tileaddr = (this.background_tile << 12) + (nt << 4) + (this._scrolly() & 7);
            this.raster_pixel();
            this.tick();

            this.raster_pixel();
            this.tick();

            attr = this._getMemory(0x23c0 | (this.vram_addr & 0xFC0) | ((this._scrolly() >> 5) << 3) | (this._scrollx() >> 5));
            if (this._scrolly() & 16) attr >>= 4;
            if (this._scrollx() & 16) attr >>= 2;
            this.raster_pixel();
            this.tick();

            this._scrollx_inc();
            if (tile == 31) this._scrolly_inc();
            this.raster_pixel();
            this.raster_sprite();
            this.tick();

            tiledatalo = this._getMemory(tileaddr);
            this.raster_pixel();
            this.tick();

            this.raster_pixel();
            this.tick();

            tiledatahi = this._getMemory(tileaddr + 8);
            this.raster_pixel();
            this.tick();

            this.raster_pixel();
            this.raster_sprite();
            this.tick();

            this.raster.nametable = (this.raster.nametable << 8) | nt;
            this.raster.attribute = (this.raster.attribute << 8) | (attr & 3);
            this.tiledatalo = (this.raster.tiledatalo << 8) | tiledatalo;
            this.tiledatahi = (this.raster.tiledatahi << 8) | tiledatahi;
        }

        for (n=0;n<8;n++) for (var m=0;m<8;m++) r._set(n, m, r._get(n, m, SOAM), OAM);

        for (var sprite = 0; sprite < 8; sprite++) {
            nt = this._getMemory(0x2000 | (this.vram_addr & 0x0FFF));
            this.tick();

            if (this._rasterEnabled() && sprite == 0) this.vram_addr = (this.vram_addr & 0x7BE0) | (this.temp_vram & 0x041F);
            this.tick();

            attr = this._getMemory(0x23C0 | (this.vram_addr & 0xFC0) | ((this._scrolly() >> 5) << 3) | (this._scrollx() >> 5));
            tileaddr = this.sprite_height
                ? ((r._get(sprite, r.OAM.TILE, OAM) & ~1) * 16) + ((r._get(sprite, r.OAM.TILE, OAM) & 1) * 0x1000)
                : (this.sprite_tile << 12) + r._get(sprite, r.OAM.TILE, OAM) * 16;
            this.tick();
            this.tick();

            var spritey = (this.ly - r._get(sprite, r.OAM.Y, OAM)) & (this.sprite_height ? 15 : 7);
            if (r._get(sprite, r.OAM.ATTR, OAM) & 0x80) spritey ^= (this.sprite_height ? 15 : 7);
            tileaddr += spritey + (spritey & 8);

            r._set(sprite, r.OAM.TILEDATALO, this._getMemory(tileaddr), OAM);
            this.tick();
            this.tick();

            r._set(sprite, r.OAM.TILEDATAHI, this._getMemory(tileaddr + 8), OAM);
            this.tick();
            this.tick();

            if (this._rasterEnabled() && sprite == 6 && this.ly == 261)
                this.vram_addr = this.temp_vram;
        }

        for (tile = 0; tile < 2; tile++) {
            nt = this._getMemory(0x2000 | (this.vram_addr & 0x0FFF));
            tileaddr = (this.background_tile << 12) + (nt << 4) + (this._scrolly() & 7);
            this.tick();
            this.tick();

            attr = this._getMemory(0x23C0 | (this.vram_addr & 0xFC0) | ((this._scrolly() >> 5) << 3) | (this._scrollx() >> 5));
            if (this._scrolly() & 16) attr >>= 4;
            if (this._scrollx() & 16) attr >>= 2;
            this.tick();

            tiledatalo = this._getMemory(tileaddr);
            this.tick();
            this.tick();

            tiledatahi = this._getMemory(tileaddr + 8);
            this.tick();
            this.tick();

            this.raster.nametable = (this.raster.nametable << 8) | nt;
            this.raster.attribute = (this.raster.attribute << 8) | (attr & 3);
            this.tiledatalo = (this.raster.tiledatalo << 8) | tiledatalo;
            this.tiledatahi = (this.raster.tiledatahi << 8) | tiledatahi;
        }

        this._getMemory(0x2000 | (this.vram_addr & 0x0FFF));
        this.tick();
        var skip = (this._rasterEnabled() && this.oddFrame && this.ly == 261);
        this.tick();

        this._getMemory(0x2000 | (this.vram_addr & 0x0FFF));
        this.tick();
        this.tick();

        if (!skip) this.tick();

        return this.scanline();
    }
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
            this.prg_rom = new Uint8Array(mapping.prg_rom);
            this.chr_rom = new Uint8Array(mapping.chr_rom);
            break;
        default:
            throw new Error("Unsupported iNES mapper");
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

var nes;
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    $(document).on("pageload", function () {
        var canvas = $("#screen")[0];
        nes = new NES(canvas);
        //nes.loadRemoteROM("assets/bin/smb.nes", function () { console.log("Loaded successfully."); });
    });
});
});
