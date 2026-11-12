/* GENERATED from the Worker's built-in defaults (worker.financial-aid.js: defaultFinancialConfig). Do not edit by hand.
   Used only when the page cannot reach the Worker (a file opened directly, or the API is down). */
window.LWTC_DEFAULT_FINANCIAL={
 "id": "financial-responsibility",
 "kind": "financial",
 "title": "Financial options & payment responsibility",
 "subtitle": "Student Acknowledgement Form",
 "intro": "Choose how you plan to pay for your program, then confirm you understand what’s due and when. It takes about five minutes.",
 "description": "Tell us how you plan to pay for your program and confirm what is due by the end of the drop/add period.",
 "audience": "All enrolling students",
 "minutes": 5,
 "bubble": "blue",
 "listed": true,
 "enabled": true,
 "availability": {
  "opens": "",
  "closes": "",
  "closedMessage": ""
 },
 "features": {
  "documents": true,
  "qrCodes": true,
  "guardian": true,
  "fafsa": true,
  "otherFunding": true,
  "fundingRequired": true
 },
 "fields": {
  "studentName": {
   "label": "Full legal name",
   "help": "",
   "required": true,
   "enabled": true
  },
  "studentId": {
   "label": "Student ID #",
   "help": "",
   "required": true,
   "enabled": true
  },
  "phone": {
   "label": "Phone number",
   "help": "",
   "required": true,
   "enabled": true
  },
  "email": {
   "label": "Email address",
   "help": "",
   "required": true,
   "enabled": true
  },
  "program": {
   "label": "Program of study",
   "help": "",
   "required": true,
   "enabled": true
  },
  "term": {
   "label": "Term",
   "help": "",
   "required": true,
   "enabled": true
  },
  "section": {
   "label": "Section",
   "help": "",
   "required": true,
   "enabled": true
  },
  "startDate": {
   "label": "Anticipated start date",
   "help": "",
   "required": true,
   "enabled": true
  },
  "dropAddEnds": {
   "label": "Drop/add period ends",
   "help": "",
   "required": true,
   "enabled": true
  },
  "fafsa": {
   "label": "FAFSA",
   "help": "",
   "required": false,
   "enabled": true
  },
  "otherFunding": {
   "label": "Other funding (describe)",
   "help": "",
   "required": true,
   "enabled": true
  }
 },
 "fundingOptions": [
  {
   "id": "fafsa",
   "enabled": true,
   "title": "Federal Student Aid (FAFSA)",
   "qrUrl": "",
   "body": "Apply at [studentaid.gov](https://studentaid.gov). The FAFSA determines eligibility for the Federal Pell Grant.\nLWTC School Code: **013234**"
  },
  {
   "id": "careersource",
   "enabled": true,
   "title": "CareerSource Southwest Florida",
   "qrUrl": "",
   "body": "Tuition assistance and workforce grants (WIOA) for eligible job seekers in Southwest Florida.\n[careersourcesouthwestflorida.com](https://careersourcesouthwestflorida.com/)"
  },
  {
   "id": "collier",
   "enabled": true,
   "title": "Collier Community Foundation",
   "qrUrl": "https://colliercf.org",
   "body": "Donor-established scholarships, including several for technical and vocational students, through one common online application.\nApply at: [colliercf.org](https://colliercf.org)"
  },
  {
   "id": "lwtc-scholarships",
   "enabled": true,
   "title": "LWTC Institutional Scholarships & Assistance",
   "qrUrl": "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=SjyUWVNiDU2KmP71AwPTS46f9pBak6FGqxzqYowUBWJUNE1MRlFFMTVRR01PQVFHVzdSQzVVNzFXQS4u",
   "body": "Institutional scholarships and Workforce Development Assistance (WDA) based on need, academic standing, and program requirements. Ask Financial Aid about current cycles.\nApply at: [LWTC Internal Scholarship Application](https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=SjyUWVNiDU2KmP71AwPTS46f9pBak6FGqxzqYowUBWJUNE1MRlFFMTVRR01PQVFHVzdSQzVVNzFXQS4u)"
  },
  {
   "id": "bright-futures",
   "enabled": true,
   "title": "Florida Bright Futures Scholarship",
   "qrUrl": "",
   "body": "Florida high school graduates who meet academic, test score, and service hour requirements — including Gold Seal Vocational and Gold Seal CAPE Scholars — Please provide to the financial aid office: award confirmation"
  },
  {
   "id": "learn2earn",
   "enabled": true,
   "title": "Learn 2 Earn Charitable Foundation",
   "qrUrl": "",
   "body": "Scholarships plus mentorship and success coaching for students pursuing career, technical, and trade certifications.\nApply at: [learn2earnscholarship.org](https://learn2earnscholarship.org/)"
  },
  {
   "id": "va",
   "enabled": true,
   "title": "Veterans Affairs (VA) Education Benefits",
   "qrUrl": "",
   "body": "Veterans, service members, and eligible dependents may use VA education benefits\nPlease provide to the Financial Aid Office:\n- DD-214 (Certificate of Discharge from Active Duty)\n- Certificate of Eligibility (COE) from the VA"
  },
  {
   "id": "vr",
   "enabled": true,
   "title": "Florida Vocational Rehabilitation (VR)",
   "qrUrl": "",
   "body": "Possible financial support and career services for individuals with physical, mental, or learning disabilities to prepare for, gain, or retain employment.\n[https://rehabworks.org/](https://rehabworks.org/)"
  }
 ],
 "fundingSources": [
  {
   "label": "CareerSource Southwest Florida",
   "enabled": true
  },
  {
   "label": "VA Education Benefits",
   "enabled": true
  },
  {
   "label": "Vocational Rehabilitation",
   "enabled": true
  },
  {
   "label": "Bright Futures Scholarship",
   "enabled": true
  },
  {
   "label": "Self-Pay / Out-of-Pocket",
   "enabled": true
  },
  {
   "label": "Collier Community Foundation Scholarship",
   "enabled": true
  },
  {
   "label": "Learn 2 Earn Scholarship",
   "enabled": true
  },
  {
   "label": "LWTC Institutional Scholarship / WDA",
   "enabled": true
  },
  {
   "label": "Florida Prepaid Plan",
   "enabled": true
  }
 ],
 "statements": [
  {
   "id": "s1",
   "enabled": true,
   "text": "I understand that **all outstanding tuition, laboratory fees, and user fees are due in full by the end of the drop/add period** for each term in which I am enrolled."
  },
  {
   "id": "s2",
   "enabled": true,
   "text": "I understand that third-party funding (FAFSA/Pell, grants, VA benefits, Vocational Rehabilitation, CareerSource, and scholarships) is subject to approval and eligibility, and that **approval or authorization must be on file with the Financial Aid Office by the end of the drop/add period** to be applied toward my balance."
  },
  {
   "id": "s3",
   "enabled": true,
   "text": "I understand that I am **ultimately and fully responsible** for all tuition, fees, books, and supply expenses incurred during my enrollment."
  },
  {
   "id": "s4",
   "enabled": true,
   "text": "If any expected funding is delayed, reduced, canceled, or insufficient to cover my total balance, **I agree to pay the remaining balance** by the deadline above, in accordance with LWTC’s payment policy."
  },
  {
   "id": "s5",
   "enabled": true,
   "text": "I understand that an unpaid balance after the drop/add period may result in my **withdrawal from class** and/or a hold on my records, transcripts, or certificate until the balance is paid."
  }
 ],
 "questions": [],
 "documents": [
  {
   "id": "award-confirmation",
   "label": "Florida Bright Futures award confirmation",
   "help": "Upload your award confirmation. You can also bring it to the Financial Aid Office.",
   "required": false,
   "max": 2,
   "showWhen": {
    "type": "source",
    "value": "Bright Futures Scholarship"
   }
  },
  {
   "id": "dd214",
   "label": "DD-214 (Certificate of Discharge from Active Duty)",
   "help": "Upload a copy, or bring it to the Financial Aid Office.",
   "required": false,
   "max": 2,
   "showWhen": {
    "type": "source",
    "value": "VA Education Benefits"
   }
  },
  {
   "id": "coe",
   "label": "Certificate of Eligibility (COE) from the VA",
   "help": "Upload a copy, or bring it to the Financial Aid Office.",
   "required": false,
   "max": 2,
   "showWhen": {
    "type": "source",
    "value": "VA Education Benefits"
   }
  }
 ],
 "signatureText": "By signing below, I confirm that I have read and understand this form and agree to its terms."
};
