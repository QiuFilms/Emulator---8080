export const opCodes = {
    // Row 0
    "NOP": "00", "LXI B": "01", "STAX B": "02", "INX B": "03",
    "INR B": "04", "DCR B": "05", "MVI B": "06", "RLC": "07",
    "NOP": "08", "DAD B": "09", "LDAX B": "0A", "DCX B": "0B",
    "INR C": "0C", "DCR C": "0D", "MVI C": "0E", "RRC": "0F",
  
    // Row 1
    "LXI D": "11", "STAX D": "12", "INX D": "13",
    "INR D": "14", "DCR D": "15", "MVI D": "16", "RAL": "17",
    "NOP": "18", "DAD D": "19", "LDAX D": "1A", "DCX D": "1B",
    "INR E": "1C", "DCR E": "1D", "MVI E": "1E", "RAR": "1F",
  
    // Row 2
    "LXI H": "21", "SHLD": "22", "INX H": "23",
    "INR H": "24", "DCR H": "25", "MVI H": "26", "DAA": "27",
    "NOP": "28", "DAD H": "29", "LHLD": "2A", "DCX H": "2B",
    "INR L": "2C", "DCR L": "2D", "MVI L": "2E", "CMA": "2F",
  
    // Row 3
    "LXI SP": "31", "STA": "32", "INX SP": "33",
    "INR M": "34", "DCR M": "35", "MVI M": "36", "STC": "37",
    "NOP": "38", "DAD SP": "39", "LDA": "3A", "DCX SP": "3B",
    "INR A": "3C", "DCR A": "3D", "MVI A": "3E", "CMC": "3F",
  
    // Row 4 (MOV instructions)
    "MOV B,B": "40", "MOV B,C": "41", "MOV B,D": "42", "MOV B,E": "43",
    "MOV B,H": "44", "MOV B,L": "45", "MOV B,M": "46", "MOV B,A": "47",
    "MOV C,B": "48", "MOV C,C": "49", "MOV C,D": "4A", "MOV C,E": "4B",
    "MOV C,H": "4C", "MOV C,L": "4D", "MOV C,M": "4E", "MOV C,A": "4F",
  
    // Row 5
    "MOV D,B": "50", "MOV D,C": "51", "MOV D,D": "52", "MOV D,E": "53",
    "MOV D,H": "54", "MOV D,L": "55", "MOV D,M": "56", "MOV D,A": "57",
    "MOV E,B": "58", "MOV E,C": "59", "MOV E,D": "5A", "MOV E,E": "5B",
    "MOV E,H": "5C", "MOV E,L": "5D", "MOV E,M": "5E", "MOV E,A": "5F",
  
    // Row 6
    "MOV H,B": "60", "MOV H,C": "61", "MOV H,D": "62", "MOV H,E": "63",
    "MOV H,H": "64", "MOV H,L": "65", "MOV H,M": "66", "MOV H,A": "67",
    "MOV L,B": "68", "MOV L,C": "69", "MOV L,D": "6A", "MOV L,E": "6B",
    "MOV L,H": "6C", "MOV L,L": "6D", "MOV L,M": "6E", "MOV L,A": "6F",
  
    // Row 7
    "MOV M,B": "70", "MOV M,C": "71", "MOV M,D": "72", "MOV M,E": "73",
    "MOV M,H": "74", "MOV M,L": "75", "HLT": "76", "MOV M,A": "77",
    "MOV A,B": "78", "MOV A,C": "79", "MOV A,D": "7A", "MOV A,E": "7B",
    "MOV A,H": "7C", "MOV A,L": "7D", "MOV A,M": "7E", "MOV A,A": "7F",
  
    // Row 8 (Arithmetic)
    "ADD B": "80", "ADD C": "81", "ADD D": "82", "ADD E": "83",
    "ADD H": "84", "ADD L": "85", "ADD M": "86", "ADD A": "87",
    "ADC B": "88", "ADC C": "89", "ADC D": "8A", "ADC E": "8B",
    "ADC H": "8C", "ADC L": "8D", "ADC M": "8E", "ADC A": "8F",
  
    // Row 9
    "SUB B": "90", "SUB C": "91", "SUB D": "92", "SUB E": "93",
    "SUB H": "94", "SUB L": "95", "SUB M": "96", "SUB A": "97",
    "SBB B": "98", "SBB C": "99", "SBB D": "9A", "SBB E": "9B",
    "SBB H": "9C", "SBB L": "9D", "SBB M": "9E", "SBB A": "9F",
  
    // Row A (Logical)
    "ANA B": "A0", "ANA C": "A1", "ANA D": "A2", "ANA E": "A3",
    "ANA H": "A4", "ANA L": "A5", "ANA M": "A6", "ANA A": "A7",
    "XRA B": "A8", "XRA C": "A9", "XRA D": "AA", "XRA E": "AB",
    "XRA H": "AC", "XRA L": "AD", "XRA M": "AE", "XRA A": "AF",
  
    // Row B
    "ORA B": "B0", "ORA C": "B1", "ORA D": "B2", "ORA E": "B3",
    "ORA H": "B4", "ORA L": "B5", "ORA M": "B6", "ORA A": "B7",
    "CMP B": "B8", "CMP C": "B9", "CMP D": "BA", "CMP E": "BB",
    "CMP H": "BC", "CMP L": "BD", "CMP M": "BE", "CMP A": "BF",
  
    // Row C (Branch)
    "RNZ": "C0", "POP B": "C1", "JNZ": "C2", "JMP": "C3",
    "CNZ": "C4", "PUSH B": "C5", "ADI": "C6", "RST 0": "C7",
    "RZ": "C8", "RET": "C9", "JZ": "CA", "CZ": "CC",
    "CALL": "CD", "ACI": "CE", "RST 1": "CF",
  
    // Row D
    "RNC": "D0", "POP D": "D1", "JNC": "D2", "OUT port": "D3",
    "CNC": "D4", "PUSH D": "D5", "SUI": "D6", "RST 2": "D7",
    "RC": "D8", "JC": "DA", "IN port": "DB", "CC": "DC",
    "SBI": "DE", "RST 3": "DF",
  
  // Row E
  "RPO": "E0", "POP H": "E1", "JPO": "E2", "XTHL": "E3",
  "CPO": "E4", "PUSH H": "E5", "ANI": "E6", "RST 4": "E7",
  "RPE": "E8", "PCHL": "E9", "JPE": "EA", "XCHG": "EB",
  "CPE": "EC", "XRI": "EE", "RST 5": "EF",

  // Row F
  "RP": "F0", "POP PSW": "F1", "JP": "F2", "DI": "F3",
  "CP": "F4", "PUSH PSW": "F5", "ORI": "F6", "RST 6": "F7",
  "RM": "F8", "SPHL": "F9", "JM": "FA", "EI": "FB",
  "CM": "FC", "CPI": "FE", "RST 7": "FF"
}


function FlipOpCodes(obj) {
  return Object.entries(obj).reduce((ret, entry) => {
    const [ key, value ] = entry;
    ret[ value ] = key;
    return ret;
}, {})}


export const hexOpCodes = FlipOpCodes(opCodes)
  