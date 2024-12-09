export const instructionsDefinitions = {
    mvi: "writes 1 byte to specified register",
    mov: "writes 1 byte from one register to another register",
    stax: "writes 1 byte from register A to memory (address described by HL registries) registries",
    ldax: "writes 1 byte from memory (address described by HL registries) to register A",
    lxi: "writes 2 bytes to specified registers pair",
    shld: "writes 2 bytes from registers pair HL to specified address",
    lhld: "writes 2 bytes from memory from specified address to registers pair HL",
    pop: "writes 8 bit data from memory (address described by HL registries) to register A",
    push: "writes 8 bit data from memory (address described by HL registries) to register A",
    sphl: "writes 2 bytes from registers pair HL to SP",
    xthl: "exchanges data between registers pair HL and memory specified by SP",
    xchg: "exchanges data between registers pair HL and registers pair DE",
}