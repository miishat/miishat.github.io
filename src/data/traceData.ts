/**
 * @file traceData.ts
 * @description Static data definition for the Execution Trace (Timeline) section.
 * Represents the user's career history as a series of "simulation states".
 * @author Mishat
 */

/**
 * Career history data entries.
 * @property {number} id - Unique ID
 * @property {number} start - Start year (decimal for precision)
 * @property {number} end - End year (decimal)
 * @property {string} stateCode - Hex code representing the state in the Waveform view
 */
export const TRACE_DATA = [
    {
        id: 0,
        start: 2025.41, // May 2025
        end: 2026.0,   // Present
        title: "Senior Design Verification Engineer",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Leading advanced verification strategies for next-generation silicon. Specializing in AI Network Control and COMPHY (SerDes). Architecting reusable UVM components and overseeing block-level regression sign-off.",
        type: "WORK",
        stateCode: "4'h3"
    },
    {
        id: 1,
        start: 2023.5,  // June 2023
        end: 2025.42,   // May 2025
        title: "Design Verification Engineer",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Designed and implemented comprehensive testbenches for SoC blocks including Ethernet controllers. Achieved 100% code and functional coverage on critical IP. Collaborated with design teams to debug complex logic failures.",
        type: "WORK",
        stateCode: "4'h2"
    },
    {
        id: 2,
        start: 2022.75, // Sept 2022
        end: 2023.25,   // March 2023
        title: "Design Verification Engineer Intern",
        company: "Marvell Technology",
        school: "",
        degree: "",
        description: "Contributed to the validation of high-speed I/O subsystems. Developed Python scripts to automate regression analysis and improve simulation efficiency.",
        type: "INTERN",
        stateCode: "4'h1"
    },
    {
        id: 3,
        start: 2017.75, // Sept 2017
        end: 2023.33,   // April 2023
        title: "Engineering Student",
        company: "",
        school: "Memorial University of Newfoundland",
        degree: "B.Eng. Electrical Engineering",
        description: "Specialized in Digital Systems and Integrated Circuits. Capstone project focused on FPGA-based hardware acceleration.",
        type: "EDU",
        stateCode: "4'h0"
    }
];
