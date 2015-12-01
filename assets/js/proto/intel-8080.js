/**
 * Intel 8080 CPU emulator in JavaScript
 *
 * Largely guided by Thibault Imbert's implementation:
 * https://github.com/thibaultimbert/Intel8080
 * No license supplied, so assuming minimal MIT.
 */
 

function uiNewFeedItem(msg) {
    $(".feed").append("<li>"+msg+"</li>");
    while ($(".feed li").length > 200) $(".feed li")[0].remove();
}


// ===================== //
//  DEBUGGING UTILITIES  //
// ===================== //

var debugOpStack = [],
    STEP_MODE = false;
function parseOpStack(stack) {
    var str = "";
    stack.forEach(function (e) {
        str += e[0] + "\t\t";
        str += e[1] + "\t";
        str += e[2] + "\t";
        if (e[3]) str += (e[3] < 10 ? e[3] : "0x"+parseFloat(e[3]).toString(16)) + " ";
        if (e[4]) str += (e[4] < 10 ? e[4] : "0x"+parseFloat(e[4]).toString(16)) + " ";
        str += "\n";
    });
    return str;
}

var compareMem = [];
function setCompareMemory(proc) {
    //proc.memory.forEach(function (e, i) { compareMem[i] = e; });
}
function compareMemory(proc) {
    /*proc.memory.forEach(function (e, i) {
        if (compareMem[i] !== e) {
            TBI.log("DISCREPANCY");
            proc.stopped = true;
            processor.stopped = true;
        }
    });*/
}


function conductRandomTest(length, noInstructions) {
    var i, a;
    noInstructions = noInstructions || length.length || length;
    cpu.reset();
    cpu.memory.forEach(function (e, i) { cpu.memory[i] = 0; });
    cpu.programCounter = 0x2400;
    if (typeof length === typeof [])
        a = length;
    else {
        a = [];
        for (i=0;i<length;i++) {
            var op = -1;
            do {
                op = Math.floor(Math.random()*256);
            } while (cpu.instructionTable[op] === undefined || [0x8,0x10,0x18,0x28,0x30,0x38,0x76,0x92,0x98,0x99,0x9a,0x9b,0x9c,0x9d,0x9e,0x9f,0xb5,0xb9,0xcb,0xd9,0xdd,0xe0,0xe2,0xe4,0xe8,0xea,0xec,0xed,0xf0,0xf4,0xf8,0xf9,0xfc,0xfd].indexOf(op) !== -1);
            
            if (cpu.instructionTable[op].indexOf("SHORT") !== -1) {
                a.push(Math.floor(Math.random()*length));
                a.push(0x24);
                i += 2;
            }
            a.push(op);
        }
    }
    cpu.stackPointer = 0x2400 + Math.floor(a.length/2);
    a.forEach(function (e, i) { cpu.memory[0x2400 + i] = e; });
    for (i=0;i<noInstructions;i++) cpu.nextInstruction();
    return a;
}

/* For reference testing.
function conductRandomTest(data, noInstructions) {
    noInstructions = noInstructions || data.length;
    processor.Reset();
    processor.B = processor.C = processor.D = processor.E = processor.H = processor.L = 0;
    processor.memory.forEach(function (e, i) { processor.memory[i] = 0; });
    processor.PC = 0x2400;
    processor.SP = 0x2400 + Math.floor(data.length/2);
    data.forEach(function (e, i) { processor.memory[0x2400 + i] = e; });
    for (var i=0;i<noInstructions;i++) processor.ExecuteInstruction();
}
function testSummary() {
    console.log("PC: %f, SP: %f, A: %f, BC: %f, DE: %f, HL: %f", processor.PC, processor.SP, processor.A, processor.BC, processor.DE, processor.HL);
    var changed = [];
    processor.memory.forEach(function (e, i) { if (e !== 0) changed.push(i + ": " + e); });
    console.log("Mem listing: " + changed.join(", "));
    console.log("SZ A P C\n%f%f %f %f %f", processor.SIGN?1:0, processor.ZERO?1:0, processor.HALFCARRY?1:0, processor.PARITY?1:0, processor.CARRY?1:0);
}
*/

function assemblerListing(data) {
    data.forEach(function (e) {
        console.log(cpu.instructionTable[e]);
    });
}

function testSummary() {
    console.log("PC: %f, SP: %f, A: %f, BC: %f, DE: %f, HL: %f", cpu.programCounter, cpu.stackPointer, cpu._getRegister(cpu.REGISTERS.A), cpu._getRP_16Bit(cpu.REGISTER_PAIRS.BC), cpu._getRP_16Bit(cpu.REGISTER_PAIRS.DE), cpu._getRP_16Bit(cpu.REGISTER_PAIRS.HL));
    var s = "Mem listing: ";
    cpu.memory.forEach(function (e, i) { if (e !== 0) s += i + ": " + e + ", "; });
    console.log(s);
    console.log("SZ A P C\n%f%f0%f0%f1%f", cpu.SIGN?1:0, cpu.ZERO?1:0, cpu.AUX_CARRY?1:0, cpu.PARITY?1:0, cpu.CARRY?1:0);
}


// ===================== //
//  PROCESSOR EMULATION  //
// ===================== //

function Intel8080() {
    
    this.registers = new Uint8Array(8);
    this.memory = new Uint8Array(65536);
    this.prepareTable();
    this.reset();
    
    var pointerSpace = new Uint16Array(2);
    Object.defineProperty(this, "stackPointer", {
        get: function () { return pointerSpace[0]; },
        set: function (v) { pointerSpace[0] = v; }
    });
    Object.defineProperty(this, "programCounter", {
        get: function () { return pointerSpace[1]; },
        set: function (v) { pointerSpace[1] = v; }
    });
}
Intel8080.prototype = {
    constructor: Intel8080,

    SIGN: false,      // condition "byte"
    ZERO: false,
    INTERRUPT: false,
    AUX_CARRY: false,
    // unused
    PARITY: false,
    // unused
    CARRY: false,

    stackPointer: 0x0,
    programCounter: 0x0,

    REGISTERS: {
        A: 7, // accumulator
        B: 0, // b pair
        C: 1,
        D: 2, // d pair
        E: 3,
        H: 4, // h pair
        L: 5
    },
    REGISTER_PAIRS: {
        BC: 0,
        DE: 1,
        HL: 2,
        SP: 3,
        PSW: 3
    },

    INSTRUCTIONS_PER_FRAME: 4000,

    registers: new Uint8Array(8),
    memory: new Uint8Array(65536),
    stopped: false,
    
    io: {
        input: function (port) { return 0; },
        output: function (port, value) {}
    },

    reset: function () {
        this.stopped = false;
        this.programCounter = 0;
        for (var i=0;i<8;i++) this.registers[i] = 0;
        this.SIGN = 0;
        this.ZERO = 0;
        this.AUX_CARRY = 0;
        this.PARITY = 0;
        this.INTERRUPT = 0;
        this.CARRY = 0;
    },

    instructionCount: 0,
    _interrupt_alternate: 0,

    _setAuxillaryCarry: function (v1, v2, v3) { v3 = v3 || 0; this.AUX_CARRY = Boolean((v1 ^ v2 ^ v3) & 0x10); return this; }, // set auxillary carry
    _setSign: function (v) { this.SIGN = Boolean(v & 128); return this; }, // set sign
    _setZero: function (v) { this.ZERO = v == 0; return this; }, // set zero
    _setCarry: function (v) { this.CARRY = v > 0xFF; return this; },
    _setParity: function (v) { this.PARITY = !((
            ((v >> 7) & 1) +
            ((v >> 6) & 1) +
            ((v >> 5) & 1) +
            ((v >> 4) & 1) +
            ((v >> 3) & 1) +
            ((v >> 2) & 1) +
            ((v >> 1) & 1) +
            (v & 1)
        ) & 1);
        return this;
    },
    _setFlagsFromRegister: function (reg) {
        var v = this._getRegister(reg);
        return this
            ._setZero(v)
            ._setSign(v)
            ._setParity(v);
    },

    _getPair: function (reg) { return (this.registers[reg] << 8) | this.registers[reg+1]; },
    _setPair: function (reg, x, y) { this.registers[reg] = x; this.registers[reg+1] = y; return this; },

    _getRP_16Bit: function (rp) {
        switch (rp) {
            case this.REGISTER_PAIRS.BC:
                return this._getPair(this.REGISTERS.B);
            case this.REGISTER_PAIRS.DE:
                return this._getPair(this.REGISTERS.D);
            case this.REGISTER_PAIRS.HL:
                return this._getPair(this.REGISTERS.H);
            case this.REGISTER_PAIRS.SP:
                return this.stackPointer;
        }
    },
    _setRP_16Bit: function (rp, v) {
        var x = (v & 0xFF00) >> 8,
            y = v & 0x00FF;

        switch (rp) {
            case this.REGISTER_PAIRS.BC:
                return this._setPair(this.REGISTERS.B, x, y);
            case this.REGISTER_PAIRS.DE:
                return this._setPair(this.REGISTERS.D, x, y);
            case this.REGISTER_PAIRS.HL:
                return this._setPair(this.REGISTERS.H, x, y);
            case this.REGISTER_PAIRS.SP:
                this.stackPointer = v;
                return this;
        }
    },

    _getMemory_16Bit: function (addr) {
        return (this.memory[addr+1] << 8) | this.memory[addr];
    },
    _setMemory_16Bit: function (addr, val) {
        this.memory[addr+1] = (val & 0xFF00) >> 8;
        this.memory[addr] = val & 0x00FF;
        return this;
    },

    _getRegister: function (reg) { return reg == 6
        ? this.memory[this._getRP_16Bit(this.REGISTER_PAIRS.HL)]
        : this.registers[reg]; },

    _setRegister: function (reg, val) { reg == 6
        ? this.memory[this._getRP_16Bit(this.REGISTER_PAIRS.HL)] = val
        : this.registers[reg] = val;
        return this;
    },

    _condition: function (cond) {
        switch (cond) {
            case 0: return !this.ZERO;      // xNZ
            case 1: return this.ZERO;       // xZ
            case 2: return !this.CARRY;     // xNC
            case 3: return this.CARRY;      // xC
            case 4: return !this.PARITY;    // xPO
            case 5: return this.PARITY;     // xPE
            case 6: return !this.SIGN;      // xP
            case 7: return this.SIGN;       // xM
        }
    },

    _getPSW: function () {
        return (
            (this.SIGN << 7) |
            (this.ZERO << 6) |
            (this.AUX_CARRY << 4) |
            (this.PARITY << 2) |
            (1 << 1) |
            (this.CARRY)
        ) | (this._getRegister(this.REGISTERS.A) << 8);
    },
    _setPSW: function (v) {
        this.SIGN =         (v >> 7) & 1;
        this.ZERO =         (v >> 6) & 1;
        this.AUX_CARRY =    (v >> 4) & 1;
        this.PARITY =       (v >> 2) & 1;
        this.CARRY =        (v >> 0) & 1;

        return this._setRegister(this.REGISTERS.A, (v >> 8) & 0xFF);
    },

    _swapRegisters: function (reg1, reg2) {
        return this
            ._setRegister(reg1, this._getRegister(reg1) ^ this._getRegister(reg2))
            ._setRegister(reg2, this._getRegister(reg1) ^ this._getRegister(reg2))
            ._setRegister(reg1, this._getRegister(reg1) ^ this._getRegister(reg2));
    },

    _accumulatorAdd: function (o1, o2) {
        o2 = o2 || 0;
        var o3 = this._getRegister(this.REGISTERS.A);
        var result = (o1 + o2 + o3);
        this._setRegister(this.REGISTERS.A, result)
            ._setFlagsFromRegister(this.REGISTERS.A)
            ._setCarry(result)
            ._setAuxillaryCarry(o1, o3, result);
    },

    _accumulatorSub: function (o1, o2) {
        o2 = o2 || 0;
        var o3 = this._getRegister(this.REGISTERS.A);
        var result = (o3 - o1 - o2) & 0xFF;
        this.CARRY = Boolean((result >= o3) && (o1 | o2));
        this.AUX_CARRY = Boolean((o3 ^ o1 ^ result) & 0x10);
        
        this._setRegister(this.REGISTERS.A, result)
            ._setFlagsFromRegister(this.REGISTERS.A);
    },

    _accumulatorAnd: function (o1) {
        this._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.A) & o1)
            ._setFlagsFromRegister(this.REGISTERS.A);

        this.CARRY = 0;
    },
    _accumulatorOr: function (o1) {
        this._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.A) | o1)
            ._setFlagsFromRegister(this.REGISTERS.A);

        this.CARRY = 0;
    },
    _accumulatorXor: function (o1) {
        this._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.A) ^ o1)
            ._setFlagsFromRegister(this.REGISTERS.A);

        this.CARRY = 0;
    },
    _accumulatorCmp: function (o1) {
        var o2 = this._getRegister(this.REGISTERS.A);
        var result = (o2 - o1) & 0xFF;
        this.CARRY = Boolean((result >= o2) && (o1));
        this._setAuxillaryCarry(o1, o2, result)
            ._setSign(result)
            ._setZero(result);
    },
    
    MOV: function (dest, src) {
        if (dest == 6 && src == 6) return this.HLT();
        this._setRegister(dest, this._getRegister(src));
    },
    MVI: function (reg, data) { this._setRegister(reg, data); },
    LXI: function (rp, src16) { this._setRP_16Bit(rp, src16); },
    LDA: function (addr) { this._setRegister(this.REGISTERS.A, this.memory[addr]); },
    STA: function (addr) { this.memory[addr] = this._getRegister(this.REGISTERS.A); },
    LHLD: function (addr) { this._setRP_16Bit(this.REGISTER_PAIRS.HL, this._getMemory_16Bit(addr)); },
    SHLD: function (addr) { this._setMemory_16Bit(addr, this._getRP_16Bit(this.REGISTER_PAIRS.HL)); },
    LDAX: function (rp) { this._setRegister(this.REGISTERS.A, this.memory[this._getRP_16Bit(rp)]); },
    STAX: function (rp) { this.memory[this._getRP_16Bit(rp)] = this._getRegister(this.REGISTERS.A); },
    XCHG: function () {
        this._swapRegisters(this.REGISTERS.H, this.REGISTERS.D);
        this._swapRegisters(this.REGISTERS.L, this.REGISTERS.E);
    },

    ADD: function (reg) { this._accumulatorAdd(this._getRegister(reg)); },
    ADC: function (reg) { this._accumulatorAdd(this._getRegister(reg), Number(this.CARRY)); },
    ADI: function (data) { this._accumulatorAdd(data); },
    ACI: function (data) { this._accumulatorAdd(data, Number(this.CARRY)); },

    SUB: function (reg) { this._accumulatorSub(this._getRegister(reg)); },
    SBB: function (reg) { this._accumulatorSub(this._getRegister(reg), Number(this.CARRY)); },
    SUI: function (data) { this._accumulatorSub(data); },
    SBI: function (data) { this._accumulatorSub(data, Number(this.CARRY)); },

    INR: function (reg) {
        var o1 = this._getRegister(reg);
        var result = (o1 + 1) & 0xFF;
        this._setRegister(reg, result)
            ._setFlagsFromRegister(reg);

        this.AUX_CARRY = (result & 0xF) != 0;
    },
    DCR: function (reg) {
        var o1 = this._getRegister(reg);
        var result = (o1 - 1) & 0xFF;
        this._setRegister(reg, result)
            ._setFlagsFromRegister(reg);

        this.AUX_CARRY = (result & 0xF) == 0;
    },
    INX: function (rp) { this._setRP_16Bit(rp, this._getRP_16Bit(rp) + 1); },
    DCX: function (rp) { this._setRP_16Bit(rp, this._getRP_16Bit(rp) - 1); },

    DAD: function (rp) {
        var result = this._getRP_16Bit(2) + this._getRP_16Bit(rp);
        this.CARRY = result > 65535;
        this._setRP_16Bit(2, result);
    },
    DAA: function () {
        var a = this._getRegister(this.REGISTERS.A);
        if (((a & 0x0F) > 9) || this.AUX_CARRY) {
            this._setRegister(this.REGISTERS.A, a + 0x06);
            this.AUX_CARRY = 1;
        } else this.AUX_CARRY = 0;
        
        a = this._getRegister(this.REGISTERS.A);

        if (((a & 0xF0) >> 4) > 9 || this.CARRY) {
            this._setRegister(this.REGISTERS.A, a + 0x60);
            this.CARRY = 1;
        } else this.CARRY = 0;
    },

    ANA: function (reg) { this._accumulatorAnd(this._getRegister(reg)); },
    ANI: function (data) { this._accumulatorAnd(data); },

    ORA: function (reg) { this._accumulatorOr(this._getRegister(reg)); },
    ORI: function (data) { this._accumulatorOr(data); },

    XRA: function (reg) { this._accumulatorXor(this._getRegister(reg)); },
    XRI: function (data) { this._accumulatorXor(data); },

    CMP: function (reg) { this._accumulatorCmp(this._getRegister(reg)); },
    CPI: function (data) { this._accumulatorCmp(data); },

    RLC: function () {
        var a = this._getRegister(this.REGISTERS.A);
        this._setRegister(this.REGISTERS.A, (a << 1) | (a >> 7));
        this.CARRY = this._getRegister(this.REGISTERS.A) & 1;
    },
    RRC: function () {
        var a = this._getRegister(this.REGISTERS.A);
        this._setRegister(this.REGISTERS.A, (a >> 1) | (a << 7));
        this.CARRY = Boolean(this._getRegister(this.REGISTERS.A) & 0x80);
    },
    RAL: function () {
        var a = this._getRegister(this.REGISTERS.A);
        this._setRegister(this.REGISTERS.A, a << 1);
        if (this.CARRY) this._setRegister(this.REGISTERS.A, (a << 1) | 1);
        this.CARRY = Boolean(a & 0x80);
    },
    RAR: function () {
        var a = this._getRegister(this.REGISTERS.A) & 0xFF;
        this._setRegister(this.REGISTERS.A, a >> 1);
        if (this.CARRY) this._setRegister(this.REGISTERS.A, (a >> 1) | 0x80);
        this.CARRY = a & 1;
    },
    CMA: function () { this._setRegister(this.REGISTERS.A, this._getRegister(this.REGISTERS.A) ^ 0xFF); },
    CMC: function () { this.CARRY = !this.CARRY; },
    STC: function () { this.CARRY = 1; },

    JMP: function (addr) { this.programCounter = addr; },
    Jccc: function (cond, addr) { if (this._condition(cond)) this.JMP(addr); },

    CALL: function (addr) {
        //uiNewFeedItem("CALL to 0x"+zeroPrefix(addr.toString(16), 4));
        this.pushStack(this.programCounter);
        this.programCounter = addr;
    },
    Cccc: function (cond, addr) { if (this._condition(cond)) this.CALL(addr); },

    RET: function () {
        //uiNewFeedItem("RET from 0x"+zeroPrefix(this.programCounter.toString(16), 4));
        this.programCounter = this.popStack();
    },
    Rccc: function (cond) { if (this._condition(cond)) this.RET(); },

    RST: function (n) {
        this.pushStack(this.programCounter);
        this.programCounter = n << 3;
    },

    PCHL: function () { this.programCounter = this._getRP_16Bit(this.REGISTER_PAIRS.HL); },
    PUSH: function (rp) {
        switch (rp) {
            case this.REGISTER_PAIRS.BC:
                this.pushStack(this._getPair(this.REGISTERS.B));
                break;
            case this.REGISTER_PAIRS.DE:
                this.pushStack(this._getPair(this.REGISTERS.D));
                break;
            case this.REGISTER_PAIRS.HL:
                this.pushStack(this._getPair(this.REGISTERS.H));
                break;
            case this.REGISTER_PAIRS.PSW:
                this.pushStack(this._getPSW());
                break;
        }
    },
    POP: function (rp) {
        var pop = this.popStack(),
            x = (pop & 0xFF00) >> 8,
            y = pop & 0x00FF;

        switch (rp) {
            case this.REGISTER_PAIRS.BC:
                this._setPair(this.REGISTERS.B, x, y);
                break;
            case this.REGISTER_PAIRS.DE:
                this._setPair(this.REGISTERS.D, x, y);
                break;
            case this.REGISTER_PAIRS.HL:
                this._setPair(this.REGISTERS.H, x, y);
                break;
            case this.REGISTER_PAIRS.PSW:
                this._setPSW(pop);
                break;
        }
    },
    XTHL: function () {
        var h = this._getRegister(this.REGISTERS.H);
        this._setRegister(this.REGISTERS.H, this.memory[this.stackPointer + 1]);
        this.memory[this.stackPointer + 1] = h;

        var l = this._getRegister(this.REGISTERS.L);
        this._setRegister(this.REGISTERS.L, this.memory[this.stackPointer]);
        this.memory[this.stackPointer] = l;
    },
    SPHL: function () {
        this.stackPointer = this._getPair(this.REGISTERS.H);
    },

    IN: function (p) { this._setRegister(this.REGISTERS.A, this.io.input(p)); },
    OUT: function (p) { this.io.output(p, this._getRegister(this.REGISTERS.A)); },

    EI: function () { this.INTERRUPT = 1; },
    DI: function () { this.INTERRUPT = 0; },
    HLT: function () { this.stopped = true; },

    NOP: function () {},

    fetchByte: function () { return this.memory[this.programCounter++]; },
    fetchShort: function () { return this.fetchByte() | (this.fetchByte() << 8); },

    pushStack: function (v) { this.stackPointer -= 2; this._setMemory_16Bit(this.stackPointer, v); },
    popStack: function () { var addr = this._getMemory_16Bit(this.stackPointer); this.stackPointer += 2; return addr; },

    callInterrupt: function (addr) {
        //uiNewFeedItem("IRQ " + addr);
        this.INTERRUPT = 0;
        this.pushStack(this.programCounter);
        this.programCounter = addr;
    },
    
    instructionTable: [],
    prepareTable: function () {
        var SHORT = "SHORT",
            BYTE = "BYTE",
            self = this;
        
        var op = 0;
        function _(operation) {
            var entry = [operation];
            for (var i=1;i<arguments.length;i++)
                entry.push(arguments[i]);
            self.instructionTable[op] = entry;
        }
        
        for (;op < 256; op++) switch ((op & 0xC0) >> 6) { // xx------

            case 0: switch (op & 0x7) { // 00---xxx

                case 0: _("NOP"); break; // 00---000

                case 1: op & 0x8 // 00--x001
                    ? _("DAD", (op & 0x30) >> 4) // 00xx1001
                    : _("LXI", (op & 0x30) >> 4, SHORT); // 00xx0001
                    break;

                case 2: switch ((op & 0x38) >> 3) { // 00xxx010
                    case 0: _("STAX", 0); break; // 00000010
                    case 1: _("LDAX", 0); break; // 00001010

                    case 2: _("STAX", 1); break; // 00010010
                    case 3: _("LDAX", 1); break; // 00011010

                    case 4: _("SHLD", SHORT); break; // 00100010
                    case 5: _("LHLD", SHORT); break; // 00101010

                    case 6: _("STA", SHORT); break; // 00110010
                    case 7: _("LDA", SHORT); break; // 00111010
                } break;

                case 3: op & 0x8 // 00--x011
                    ? _("DCX", (op & 0x30) >> 4) // 00xx1101
                    : _("INX", (op & 0x30) >> 4); // 00xx0101
                    break;

                case 4: _("INR", (op & 0x38) >> 3); break; // 00xxx100
                case 5: _("DCR", (op & 0x38) >> 3); break; // 00xxx101

                case 6: _("MVI", (op & 0x38) >> 3, BYTE); break; // 00xxx110

                case 7: switch ((op & 0x38) >> 3) { // 00xxx111
                    case 0: _("RLC"); break; // 00000111
                    case 1: _("RRC"); break; // 00001111
                    case 2: _("RAL"); break; // 00010111
                    case 3: _("RAR"); break; // 00011111

                    case 4: _("DAA"); break; // 00100111

                    case 5: _("CMA"); break; // 00101111
                    case 6: _("STC"); break; // 00110111
                    case 7: _("CMC"); break; // 00111111
                } break;
            } break;

            case 1: _("MOV", (op & 0x38) >> 3, op & 0x7); break; // 01xxxyyy

            case 2: switch ((op & 0x38) >> 3) { // 10xxx000
                case 0: _("ADD", op & 0x7); break; // 10000xxx
                case 1: _("ADC", op & 0x7); break; // 10001xxx

                case 2: _("SUB", op & 0x7); break; // 10010xxx
                case 3: _("SBB", op & 0x7); break; // 10011xxx

                case 4: _("ANA", op & 0x7); break; // 10100xxx
                case 5: _("XRA", op & 0x7); break; // 10101xxx
                case 6: _("ORA", op & 0x7); break; // 10110xxx
                case 7: _("CMP", op & 0x7); break; // 10111xxx
            } break;

            case 3: switch (op & 0x7) { // 11---xxx

                case 0: _("Rccc", (op & 0x38) >> 3); break; // 11xxx000

                case 1: if (op & 0x8) switch ((op & 0x30) >> 4) { // 11xx1001
                    case 0: _("RET"); break; // 11001001
                    case 1: break; // 11011001 - didn't find an instruction
                    case 2: _("PCHL"); break; // 11101001
                    case 3: _("SPHL"); break; // 11111001
                } else _("POP", (op & 0x30) >> 4); break; // 11xx0001

                case 2: _("Jccc", (op & 0x38) >> 3, SHORT); break; // 11xxx010

                case 3: switch ((op & 0x38) >> 3) { // 11xxx011
                    case 0: _("JMP", SHORT); break; // 11000011
                    case 1: break; // 11001011 - didn't find an instruction

                    case 2: _("OUT", BYTE); break; // 11010011
                    case 3: _("IN", BYTE); break; // 11011011

                    case 4: _("XTHL"); break; // 11100011
                    case 5: _("XCHG"); break; // 11101011

                    case 6: _("DI"); break; // 11110011
                    case 7: _("EI"); break; // 11111011
                } break;

                case 4: _("Cccc", (op & 0x38) >> 3, SHORT); break; // 11xxx100

                case 5: op & 0x8 // 11--x101
                    ? _("CALL", SHORT) // 11--1101
                    : _("PUSH", (op & 0x30) >> 4); break; // 11xx0101

                case 6: switch ((op & 0x38) >> 3) { // 11xxx110
                    case 0: _("ADI", BYTE); break; // 11000110
                    case 1: _("ACI", BYTE); break; // 11001110

                    case 2: _("SUI", BYTE); break; // 11010110
                    case 3: _("SBI", BYTE); break; // 11011110

                    case 4: _("ANI", BYTE); break; // 11100110
                    case 5: _("XRI", BYTE); break; // 11101110
                    case 6: _("ORI", BYTE); break; // 11110110
                    case 7: _("CPI", BYTE); break; // 11111110
                } break;

                case 7: _("RST", (op & 0x38) >> 3); break; // 11xxx111
            } break;
        }
    },

    nextInstruction: function () {
        var op = this.fetchByte(),
            self = this,
            memloc = this.programCounter - 1/*,
            _ = function (o) {
                var args = [];
                for (var i=1;i<arguments.length;i++)
                    args.push(arguments[i]);
                self[o].apply(self, args);
                args.unshift(zeroPrefix(o, 4, " "));
                args.unshift("0x"+zeroPrefix(op.toString(16), 2, "0"));
                args.unshift(zeroPrefix(memloc.toString(16), 4, "0"));
                if (o !== "NOP") debugOpStack.push(args);
            }*/;
        
        if (this.instructionTable[op] !== undefined) {
            var entry = this.instructionTable[op],
                a = [],
                _ = function (i) {
                    var result;
                    if (entry[i] === undefined) return undefined;
                    else if (entry[i] === "SHORT") result = self.fetchShort();
                    else if (entry[i] === "BYTE") result = self.fetchByte();
                    else result = entry[i];
                    //a.push(result);
                    return result;
                };
            
            
            if (STEP_MODE) {
                function __(i) {
                    if (entry[i] === undefined) return undefined;
                    else if (entry[i] === "SHORT") return zeroPrefix(cpu._getMemory_16Bit(memloc+1).toString(16), 4);
                    else if (entry[i] === "BYTE") return zeroPrefix(cpu.memory[memloc+1].toString(16), 2);
                    else return entry[i];
                }
                a.unshift(entry[0]);
                
                var s = "";
                s += zeroPrefix(op.toString(16), 2);
                if (entry.indexOf("BYTE") !== -1 || entry.indexOf("SHORT") !== -1) 
                    s += " " + zeroPrefix(cpu.memory[memloc+1].toString(16), 2);
                if (entry.indexOf("SHORT") !== -1) 
                    s += zeroPrefix(cpu.memory[memloc+2].toString(16), 2);
                
                a.unshift(s);
                
                a.unshift(zeroPrefix(memloc.toString(16), 4, "0"));
                
                s = "";
                if (entry[1]) s += " " + __(1);
                if (entry[2]) s += " " + __(2);
                a.push(s);
                
                //if (entry[0] !== "NOP") debugOpStack.push(a);
                uiNewFeedItem("<pre><code>" + a.join("\t") + "</code></pre>");
            }
            
            this[entry[0]](_(1), _(2));
        } else {
            this.HLT();
            uiNewFeedItem("Encountered invalid opcode!");
            throw new Error("Invalid opcode!");
        }

        this.instructionCount++;
        if (this.instructionCount >= (this.INSTRUCTIONS_PER_FRAME >> 1)) {
            if (this.INTERRUPT) {
                this.callInterrupt(this._interrupt_alternate ? 0x10 : 0x08);
            }

            this._interrupt_alternate = !this._interrupt_alternate;
            this.instructionCount = 0;
        }
    },
    
    run: function () {
        for (var i=0;i<this.INSTRUCTIONS_PER_FRAME;i++)
            this.nextInstruction();
    },

    loadRemoteROM: function (url, callback) {
        var self = this;

        var req = new XMLHttpRequest();
        req.open("GET", "assets/bin/invaders.rom", true);
        req.responseType = "arraybuffer";
        req.onload = function (evt) {
            var buf = req.response;
            if (buf) {
                var src = new Uint8Array(buf);
                if (src.length > 8192)
                    throw new Error("Bad ROM size!");
                
                var byteArray = new ArrayBuffer(16384),
                    view = new Uint8Array(byteArray);
                view.set(src);
                self.memory = view;

                callback();
            }
        };
        req.send();
    }
};


// ================== //
//  SCREEN EMULATION  //
// ================== //

function ScreenEmulator(cpu, canvas, width, height) {
    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.cpu = cpu;
    this.helper = new CvsHelper(canvas);
    this.helper.clear();
    this.imageData = this.canvas.createImageData(width, height);
}
ScreenEmulator.prototype = {
    constructor: ScreenEmulator,
    draw: function () {
        this.canvas.fillRect(0, 0, this.width, this.height);
        this.process();
    },
    process: function () {
        var color = 0;
        var k = 0;
        var src;
        var vram;
        for(var j = 0; j < this.height; j++) {
            //src = Math.floor((0x800/32)*((+(new Date) % 3600) / 3600))*32 + (j << 5);
            src = 0x2400 + (j << 5);
            k = 0;
            for(var i = 0; i < 32; i++) {
                vram = this.cpu.memory[src];
                src += 1;
                for(var b = 0; b < 8; b++) {
                    color = 0xFF000000;
                    if(vram & 1) {
                        color = 0xFFFFFFFF;
                    }
                    this.setPixel(this.imageData, k, j, color);
                    k++;
                    vram = vram >> 1;
                }
            }
        }
        this.canvas.putImageData(this.imageData, 0, 0);
    },
    setPixel: function (imagedata, x, y, colour) {
        var i = (y * (imagedata.width | 0) + x) * 4;
        imagedata.data[i++] = (colour >> 16) & 0xFF;
        imagedata.data[i++] = (colour >> 8) & 0xFF;
        imagedata.data[i++] = colour & 0xFF;
        imagedata.data[i] = (colour >> 24) & 0xFF;
    }
};

function updateUI() {
    function fill8Bit(r) { $(".register-"+r.toLowerCase()).val(zeroPrefix(cpu._getRegister(cpu.REGISTERS[r.toUpperCase()]).toString(16), 2)); }
    "a|b|c|d|e|h|l".split("|").forEach(fill8Bit);
    
    $(".stack-pointer").val(zeroPrefix(cpu.stackPointer.toString(16), 4));
    $(".program-counter").val(zeroPrefix(cpu.programCounter.toString(16), 4));
}


// =============== //
//  I/O EMULATION  //
// =============== //

function InputOutput(cpu) {
    this.cpu = cpu;
    cpu.io = this;
    
    this._inport1 |= (0x1 | 0x2);
    this._inport2 |= (0x80);
    
    var m = {};
    
    m[Keys.LEFT] =  [this.INPUTS.LEFT];
    m[Keys.RIGHT] = [this.INPUTS.RIGHT];
    m[Keys.UP] =    [this.INPUTS.FIRE];

    m[Keys.A] =     [this.INPUTS.LEFT];
    m[Keys.D] =     [this.INPUTS.RIGHT];
    m[Keys.W] =     [this.INPUTS.FIRE];

    m[Keys.SPACE] = [this.INPUTS.FIRE];
        
    m[Keys.R] = [this.INPUTS.RESET];
    m[Keys.C] = [this.INPUTS.INSERT_COIN];
    m[Keys.Z] = [this.INPUTS.SINGLE_PLAYER];
    m[Keys.X] = [this.INPUTS.MULTI_PLAYER];
    
    this.mappings = m;
    
    var self = this;
    $(document).keydown(function (event) {
        var entry = self.mappings[event.which];
        if (entry) entry.forEach(function (e) { self.state[e] = true; });
    });
    $(document).keyup(function (event) {
        var entry = self.mappings[event.which];
        if (entry) entry.forEach(function (e) { self.state[e] = false; });
    });
}
InputOutput.prototype = {
    constructor: InputOutput,
    
    _outport2: 0,
    _outport3: 0,
    _outport4_lo: 0,
    _outport4_hi: 0,
    _outport5: 0,
    _inport1: 0,
    _inport2: 0,
    
    INPUTS: {
        LEFT: 0,
        RIGHT: 1,
        FIRE: 2,
        RESET: 3,
        SINGLE_PLAYER: 4,
        MULTI_PLAYER: 5,
        INSERT_COIN: 6
    },
    
    mappings: {
    },
    state: {
    },
    
    update: function () {
        this._inport1 &= (~(0x1 | 0x2 | 0x4 | 0x10 | 0x20 | 0x40));
        this._inport2 &= (~(0x4 | 0x10 | 0x20 | 0x40));
        
        if (this.state[this.INPUTS.INSERT_COIN]) this._inport1 |= 0x1;
        if (this.state[this.INPUTS.MULTI_PLAYER]) this._inport1 |= 0x2;
        if (this.state[this.INPUTS.SINGLE_PLAYER]) this._inport1 |= 0x4;
        
        if (this.state[this.INPUTS.FIRE]) { this._inport1 |= 0x10; this._inport2 |= 0x10; }
        if (this.state[this.INPUTS.LEFT]) { this._inport1 |= 0x20; this._inport2 |= 0x20; }
        if (this.state[this.INPUTS.RIGHT]) { this._inport1 |= 0x40; this._inport2 |= 0x40; }
        
        if (this.state[this.INPUTS.RESET])
            this.cpu.reset();
    },
    
    input: function (port) {
        var value = 0;
        switch (port) {
            case 1:
                value = this._inport1;
                break;
            case 2:
                value = this._inport2;
                break;
            case 3:
                value = ((((this._outport4_hi << 8) | this._outport4_lo) << this._outport2) >> 8);
                break;
        }
        return value;
    },
    output: function (port, value) {
        switch (port) {
            case 2:
                this._outport2 = value;
                break;
            case 3:
                this._outport3 = value;
                break;
            case 4:
                this._outport4_lo = this._outport4_hi;
                this._outport4_hi = value;
                break;
            case 5:
                this._outport5 = value;
        }
    }
};

var cpu, scr, io;
function loop() {
    if (cpu.stopped)
        TBI.log("CPU HALT");
    else {
        try { 
            io.update();
            cpu.run(); 
            scr.draw();
            updateUI();
            
            window.setTimeout(loop, 16);
            
        } catch (e) { TBI.error("A CPU error occurred: "+e.message); }
    }
}
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    $(document).on("pageload", function () {
        cpu = new Intel8080();
        var cvs = $("#screen")[0].getContext("2d");
        scr = new ScreenEmulator(cpu, cvs, cvs.canvas.width, cvs.canvas.height);
        io = new InputOutput(cpu);
        cpu.loadRemoteROM("assets/bin/invaders.bin", function () {
            loop();
        });
        
        $(".register-a").change(function () { cpu._setRegister(cpu.REGISTERS.A, parseInt($(this).val(), 16) || 0); });
        $(".register-b").change(function () { cpu._setRegister(cpu.REGISTERS.B, parseInt($(this).val(), 16) || 0); });
        $(".register-c").change(function () { cpu._setRegister(cpu.REGISTERS.C, parseInt($(this).val(), 16) || 0); });
        $(".register-d").change(function () { cpu._setRegister(cpu.REGISTERS.D, parseInt($(this).val(), 16) || 0); });
        $(".register-e").change(function () { cpu._setRegister(cpu.REGISTERS.E, parseInt($(this).val(), 16) || 0); });
        $(".register-h").change(function () { cpu._setRegister(cpu.REGISTERS.H, parseInt($(this).val(), 16) || 0); });
        $(".register-l").change(function () { cpu._setRegister(cpu.REGISTERS.L, parseInt($(this).val(), 16) || 0); });
        $(".stack-pointer").change(function () { cpu.stackPointer = parseInt($(this).val(), 16) || 0; });
        $(".program-counter").change(function () { cpu.programCounter = parseInt($(this).val(), 16) || 0; });
        $(".start-cpu").click(function () { cpu.stopped = false; loop(); });
        $(".stop-cpu").click(function () { cpu.HLT(); });
        
        function step() {
            STEP_MODE = true; 
            cpu.HLT(); 
            io.update(); 
            cpu.nextInstruction(); 
            scr.draw(); 
            updateUI(); 
            STEP_MODE = false; 
        }
        $(".step-cpu").click(step);
        
        var stepInterval, stepDelay;
        $(".step-cpu").mousedown(function () { 
            stepDelay = setTimeout(function () { stepInterval = setInterval(step, 10); }, 1000);
        });
        
        var mouseup = function () { clearInterval(stepInterval); clearTimeout(stepDelay); };
        $(".step-cpu").on("mouseup", mouseup)
                      .on("mouseleave", mouseup);
        
        var resetTimeout = 0;
        $(".reset-cpu").click(function () { cpu.stopped = true; cpu.reset(); clearTimeout(resetTimeout); resetTimeout = setTimeout(loop, 1000); });
    });
});
});