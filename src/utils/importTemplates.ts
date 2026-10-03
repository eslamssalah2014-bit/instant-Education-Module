import * as XLSX from 'xlsx';

export const downloadTeachersImportTemplate = () => {
  const sampleData = [
    {
      'Teacher Code': 'INS-0001',
      'Teacher Name': 'Ahmed Mohamed',
      'Email': 'ahmed.mohamed@scalora.com',
      'Phone Number': '+20 100 123 4567',
      'Track': 'Frontend Development',
      'Employment Type': 'FULL_TIME',
      'Status': 'ACTIVE',
    },
    {
      'Teacher Code': 'INS-0002',
      'Teacher Name': 'Sara Hassan',
      'Email': 'sara.hassan@scalora.com',
      'Phone Number': '+20 100 987 6543',
      'Track': 'Backend Development',
      'Employment Type': 'FULL_TIME',
      'Status': 'ACTIVE',
    },
    {
      'Teacher Code': '', // Leave empty to demonstrate auto-generation
      'Teacher Name': 'Khaled Ali',
      'Email': 'khaled.ali@scalora.com',
      'Phone Number': '+20 111 223 3445',
      'Track': 'Mobile Development',
      'Employment Type': 'CONTRACT',
      'Status': 'ACTIVE',
    },
  ];

  const instructions = [
    {
      Field: 'Teacher Code',
      Requirement: 'Optional',
      Description: 'Unique identifier (e.g. INS-0001). If left blank, the system automatically assigns the next sequential code (INS-0001, INS-0002...).',
    },
    {
      Field: 'Teacher Name',
      Requirement: 'Required',
      Description: 'Full name of the faculty member or teacher.',
    },
    {
      Field: 'Email',
      Requirement: 'Required',
      Description: 'Unique email address for system login and communication.',
    },
    {
      Field: 'Phone Number',
      Requirement: 'Optional',
      Description: 'Direct contact phone number.',
    },
    {
      Field: 'Track',
      Requirement: 'Required',
      Description: 'Academic track name or code (e.g. Frontend Development, Backend Development, Mobile Development).',
    },
    {
      Field: 'Employment Type',
      Requirement: 'Optional',
      Description: 'FULL_TIME, PART_TIME, or CONTRACT (defaults to FULL_TIME).',
    },
    {
      Field: 'Status',
      Requirement: 'Optional',
      Description: 'ACTIVE, ON_LEAVE, or INACTIVE (defaults to ACTIVE).',
    },
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  wsData['!cols'] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Teachers');

  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, 'Teachers Template.xlsx');
};

export const downloadGroupsImportTemplate = () => {
  const sampleData = [
    {
      'Group Code': 'FS-001',
      'Group Name': 'Full Stack Group 1',
      'Track': 'Frontend Development',
      'Teacher Code': 'INS-0001',
      'Start Date': '2026-10-01',
      'End Date': '2026-12-31',
      'Status': 'ACTIVE',
      'Session Number': 1,
      'Session Name': 'Session 1 - HTML & Modern Web Standards',
      'Session Link': 'https://zoom.us/j/98765432101',
      'Session Passcode': '123456',
    },
    {
      'Group Code': 'FS-001',
      'Group Name': 'Full Stack Group 1',
      'Track': 'Frontend Development',
      'Teacher Code': 'INS-0001',
      'Start Date': '2026-10-01',
      'End Date': '2026-12-31',
      'Status': 'ACTIVE',
      'Session Number': 2,
      'Session Name': 'Session 2 - CSS Grid, Flexbox & Responsive UI',
      'Session Link': 'https://zoom.us/j/98765432102',
      'Session Passcode': '654321',
    },
    {
      'Group Code': 'FS-001',
      'Group Name': 'Full Stack Group 1',
      'Track': 'Frontend Development',
      'Teacher Code': 'INS-0001',
      'Start Date': '2026-10-01',
      'End Date': '2026-12-31',
      'Status': 'ACTIVE',
      'Session Number': 3,
      'Session Name': 'Session 3 - JavaScript ES6+ & DOM Manipulation',
      'Session Link': 'https://meet.google.com/abc-defg-hij',
      'Session Passcode': '789012',
    },
    {
      'Group Code': 'BE-001',
      'Group Name': 'Backend Engineering Node.js',
      'Track': 'Backend Development',
      'Teacher Code': 'INS-0002',
      'Start Date': '2026-10-15',
      'End Date': '2027-01-15',
      'Status': 'ACTIVE',
      'Session Number': 1,
      'Session Name': 'Session 1 - Node.js Architecture & Asynchronous Event Loop',
      'Session Link': 'https://teams.microsoft.com/l/meetup-join/19928374',
      'Session Passcode': 'backend99',
    },
    {
      'Group Code': 'BE-001',
      'Group Name': 'Backend Engineering Node.js',
      'Track': 'Backend Development',
      'Teacher Code': 'INS-0002',
      'Start Date': '2026-10-15',
      'End Date': '2027-01-15',
      'Status': 'ACTIVE',
      'Session Number': 2,
      'Session Name': 'Session 2 - RESTful API Design & Express Middleware',
      'Session Link': 'https://teams.microsoft.com/l/meetup-join/19928375',
      'Session Passcode': 'backend99',
    },
  ];

  const instructions = [
    {
      Field: 'Group Code',
      Requirement: 'Required',
      Description: 'Unique identifier for the cohort (e.g. FS-001, BE-001). Multiple rows can have the same Group Code to attach multiple sessions to that group.',
    },
    {
      Field: 'Group Name',
      Requirement: 'Required',
      Description: 'Descriptive title of the student group/cohort.',
    },
    {
      Field: 'Track',
      Requirement: 'Required',
      Description: 'Academic track name or code that this group belongs to.',
    },
    {
      Field: 'Teacher Code',
      Requirement: 'Required',
      Description: 'Teacher Code of the assigned instructor (e.g. INS-0001). Must match an existing teacher code.',
    },
    {
      Field: 'Start Date',
      Requirement: 'Optional',
      Description: 'Cohort start date (YYYY-MM-DD format).',
    },
    {
      Field: 'End Date',
      Requirement: 'Optional',
      Description: 'Cohort completion date (YYYY-MM-DD format).',
    },
    {
      Field: 'Status',
      Requirement: 'Optional',
      Description: 'ACTIVE, UPCOMING, COMPLETED, or ARCHIVED (defaults to ACTIVE).',
    },
    {
      Field: 'Session Number',
      Requirement: 'Optional / Recommended',
      Description: 'Sequential integer indicating session order (e.g. 1, 2, 3). If omitted, auto-numbered sequentially per group.',
    },
    {
      Field: 'Session Name',
      Requirement: 'Optional',
      Description: 'Title or topic of the session (e.g. Session 1 - Introduction, Session 2 - Deep Dive).',
    },
    {
      Field: 'Session Link',
      Requirement: 'Optional',
      Description: 'Direct meeting URL (Zoom, Google Meet, Microsoft Teams, etc.) for live observation.',
    },
    {
      Field: 'Session Passcode',
      Requirement: 'Optional',
      Description: 'Meeting access passcode or PIN (visible directly in group details for 1-click copying).',
    },
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.json_to_sheet(sampleData);
  wsData['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 40 },
    { wch: 38 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Groups & Sessions');

  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, 'Groups Template.xlsx');
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
