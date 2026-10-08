import { hash } from "bcryptjs";
import prisma from "../src/lib/prisma";

const DEMO_PASSWORD = "Demo@123";

async function main() {
  console.log("🌱 Starting MediCloud synthetic seed...");
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  // 1. Departments
  const deptData = [
    { name: "General Medicine", description: "Primary care, adult medicine, preventive healthcare" },
    { name: "Cardiology", description: "Cardiovascular diagnosis, interventional cardiology, hypertension care" },
    { name: "Orthopedics", description: "Musculoskeletal trauma, joint replacement, spine care" },
    { name: "Pediatrics", description: "Neonatal, infant, child and adolescent medical care" },
    { name: "Dermatology", description: "Skin diseases, allergies, cosmetic dermatology" },
    { name: "ENT", description: "Ear, nose, throat and head-neck disorders" },
  ];

  const departments: Record<string, string> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: { description: d.description },
      create: d,
    });
    departments[d.name] = dept.id;
  }
  console.log("✅ 6 Departments seeded");

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@medicloud.demo" },
    update: { passwordHash, isActive: true },
    create: {
      name: "Dr. Vikramaditya Rao",
      email: "admin@medicloud.demo",
      passwordHash,
      role: "ADMIN",
      phone: "+91 98765 43210",
      isActive: true,
    },
  });
  console.log("✅ Admin user seeded:", admin.email);

  // 3. Receptionists
  const receptionists = [
    { name: "Pooja Verma", email: "reception@medicloud.demo", phone: "+91 98111 22334" },
    { name: "Amitabh Sen", email: "reception2@medicloud.demo", phone: "+91 98222 33445" },
  ];
  for (const r of receptionists) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { passwordHash, isActive: true },
      create: {
        name: r.name,
        email: r.email,
        passwordHash,
        role: "RECEPTIONIST",
        phone: r.phone,
        isActive: true,
      },
    });
  }
  console.log("✅ 2 Receptionists seeded");

  // 4. Doctors (6 doctors, 1 per dept)
  const doctorSpecs = [
    {
      name: "Dr. Rajesh Sharma",
      email: "doctor@medicloud.demo",
      dept: "Cardiology",
      spec: "Senior Consultant Cardiologist",
      fee: 800,
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      start: "09:00",
      end: "17:00",
    },
    {
      name: "Dr. Anita Desai",
      email: "dr.anita@medicloud.demo",
      dept: "General Medicine",
      spec: "Internal Medicine Specialist",
      fee: 500,
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      start: "08:30",
      end: "16:30",
    },
    {
      name: "Dr. Vikram Kulkarni",
      email: "dr.vikram@medicloud.demo",
      dept: "Orthopedics",
      spec: "Orthopedic & Spine Surgeon",
      fee: 900,
      days: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      start: "10:00",
      end: "18:00",
    },
    {
      name: "Dr. Priya Nair",
      email: "dr.priya@medicloud.demo",
      dept: "Pediatrics",
      spec: "Consultant Pediatrician",
      fee: 600,
      days: ["MONDAY", "TUESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      start: "09:00",
      end: "15:00",
    },
    {
      name: "Dr. Suresh Menon",
      email: "dr.suresh@medicloud.demo",
      dept: "Dermatology",
      spec: "Dermatologist & Cosmetologist",
      fee: 700,
      days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      start: "11:00",
      end: "19:00",
    },
    {
      name: "Dr. Meera Iyer",
      email: "dr.meera@medicloud.demo",
      dept: "ENT",
      spec: "Otolaryngologist (ENT Specialist)",
      fee: 650,
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "FRIDAY"],
      start: "09:30",
      end: "16:30",
    },
  ];

  const doctorProfiles: Array<{ id: string; userId: string; deptId: string; fee: number; spec: string }> = [];

  for (const doc of doctorSpecs) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: { passwordHash, isActive: true },
      create: {
        name: doc.name,
        email: doc.email,
        passwordHash,
        role: "DOCTOR",
        phone: "+91 97" + Math.floor(10000000 + Math.random() * 90000000),
        isActive: true,
      },
    });

    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        departmentId: departments[doc.dept],
        specialization: doc.spec,
        consultationFee: doc.fee,
        slotMinutes: 30,
        workingDays: doc.days,
        startTime: doc.start,
        endTime: doc.end,
      },
      create: {
        userId: user.id,
        departmentId: departments[doc.dept],
        specialization: doc.spec,
        consultationFee: doc.fee,
        slotMinutes: 30,
        workingDays: doc.days,
        startTime: doc.start,
        endTime: doc.end,
      },
    });

    doctorProfiles.push({
      id: profile.id,
      userId: user.id,
      deptId: departments[doc.dept],
      fee: doc.fee,
      spec: doc.spec,
    });
  }
  console.log("✅ 6 Doctors with profiles seeded");

  // 5. Demo Patient User + 40 Synthetic Patients
  const demoPatientUser = await prisma.user.upsert({
    where: { email: "patient@medicloud.demo" },
    update: { passwordHash, isActive: true },
    create: {
      name: "Rohan S. Patel",
      email: "patient@medicloud.demo",
      passwordHash,
      role: "PATIENT",
      phone: "+91 98450 12345",
      isActive: true,
    },
  });

  const patientNames = [
    { name: "Rohan S. Patel", gender: "MALE", dob: "1988-04-12", blood: "O+", allergies: "Penicillin", phone: "+91 98450 12345", email: "patient@medicloud.demo", isUser: true },
    { name: "Sunita Devi Sharma", gender: "FEMALE", dob: "1975-09-23", blood: "B+", allergies: "Sulfa drugs", phone: "+91 98451 23456" },
    { name: "Arjun Reddy", gender: "MALE", dob: "1995-11-05", blood: "A+", allergies: "None", phone: "+91 98452 34567" },
    { name: "Kavita Krishnamurthy", gender: "FEMALE", dob: "1982-01-30", blood: "AB+", allergies: "Aspirin", phone: "+91 98453 45678" },
    { name: "Mohammed Farooq", gender: "MALE", dob: "1968-07-14", blood: "O-", allergies: "Iodine contrast", phone: "+91 98454 56789" },
    { name: "Deepika Padukone", gender: "FEMALE", dob: "1991-03-18", blood: "A-", allergies: "Peanuts", phone: "+91 98455 67890" },
    { name: "Harpreet Singh Sandhu", gender: "MALE", dob: "1984-12-08", blood: "B+", allergies: "None", phone: "+91 98456 78901" },
    { name: "Ananya Bannerjee", gender: "FEMALE", dob: "2000-05-19", blood: "O+", allergies: "Dust, Pollen", phone: "+91 98457 89012" },
    { name: "Siddharth Jain", gender: "MALE", dob: "1993-08-25", blood: "A+", allergies: "None", phone: "+91 98458 90123" },
    { name: "Meenakshi Sundaram", gender: "FEMALE", dob: "1960-02-11", blood: "B-", allergies: "ACE inhibitors", phone: "+91 98459 01234" },
    { name: "Gaurav Malhotra", gender: "MALE", dob: "1989-10-15", blood: "AB-", allergies: "None", phone: "+91 98460 12345" },
    { name: "Lakshmi Narayanan", gender: "FEMALE", dob: "1978-06-04", blood: "O+", allergies: "Codeine", phone: "+91 98461 23456" },
    { name: "Tariq Mansoor", gender: "MALE", dob: "1972-04-29", blood: "B+", allergies: "None", phone: "+91 98462 34567" },
    { name: "Neha Chawla", gender: "FEMALE", dob: "1997-12-01", blood: "A+", allergies: "Latex", phone: "+91 98463 45678" },
    { name: "Vijay Kumar", gender: "MALE", dob: "1965-08-17", blood: "O+", allergies: "None", phone: "+91 98464 56789" },
    { name: "Shweta Tiwari", gender: "FEMALE", dob: "1986-07-22", blood: "B+", allergies: "Ciprofloxacin", phone: "+91 98465 67890" },
    { name: "Manoj Bajpai", gender: "MALE", dob: "1969-04-23", blood: "A+", allergies: "None", phone: "+91 98466 78901" },
    { name: "Ritu Phogat", gender: "FEMALE", dob: "1994-05-02", blood: "AB+", allergies: "None", phone: "+91 98467 89012" },
    { name: "Dinesh Karthik", gender: "MALE", dob: "1985-06-01", blood: "O+", allergies: "NSAIDs", phone: "+91 98468 90123" },
    { name: "Bhavna Joshi", gender: "FEMALE", dob: "1992-09-14", blood: "B+", allergies: "None", phone: "+91 98469 01234" },
    { name: "Pranav Mistry", gender: "MALE", dob: "1981-05-14", blood: "A-", allergies: "None", phone: "+91 98470 12345" },
    { name: "Aishwarya Rai", gender: "FEMALE", dob: "1973-11-01", blood: "O+", allergies: "Sulfa", phone: "+91 98471 23456" },
    { name: "Suresh Raina", gender: "MALE", dob: "1986-11-27", blood: "B+", allergies: "None", phone: "+91 98472 34567" },
    { name: "Zoya Akhtar", gender: "FEMALE", dob: "1972-10-14", blood: "A+", allergies: "None", phone: "+91 98473 45678" },
    { name: "Kunal Kamra", gender: "MALE", dob: "1988-10-03", blood: "O-", allergies: "Shellfish", phone: "+91 98474 56789" },
    { name: "Smriti Mandhana", gender: "FEMALE", dob: "1996-07-18", blood: "B+", allergies: "None", phone: "+91 98475 67890" },
    { name: "Naveen Patnaik", gender: "MALE", dob: "1946-10-16", blood: "AB+", allergies: "Contrast dye", phone: "+91 98476 78901" },
    { name: "Geeta Phogat", gender: "FEMALE", dob: "1988-12-15", blood: "O+", allergies: "None", phone: "+91 98477 89012" },
    { name: "Raghuram Rajan", gender: "MALE", dob: "1963-02-03", blood: "A+", allergies: "None", phone: "+91 98478 90123" },
    { name: "Shreya Ghoshal", gender: "FEMALE", dob: "1984-03-12", blood: "B+", allergies: "Dust", phone: "+91 98479 01234" },
    { name: "Chetan Bhagat", gender: "MALE", dob: "1974-04-22", blood: "O+", allergies: "None", phone: "+91 98480 12345" },
    { name: "Mithali Raj", gender: "FEMALE", dob: "1982-12-03", blood: "A+", allergies: "None", phone: "+91 98481 23456" },
    { name: "Abhinav Bindra", gender: "MALE", dob: "1982-09-28", blood: "B-", allergies: "None", phone: "+91 98482 34567" },
    { name: "Mary Kom", gender: "FEMALE", dob: "1982-11-24", blood: "O+", allergies: "None", phone: "+91 98483 45678" },
    { name: "Sania Mirza", gender: "FEMALE", dob: "1986-11-15", blood: "AB-", allergies: "Penicillin", phone: "+91 98484 56789" },
    { name: "Sunil Chhetri", gender: "MALE", dob: "1984-08-03", blood: "A+", allergies: "None", phone: "+91 98485 67890" },
    { name: "PV Sindhu", gender: "FEMALE", dob: "1995-07-05", blood: "B+", allergies: "None", phone: "+91 98486 78901" },
    { name: "Neeraj Chopra", gender: "MALE", dob: "1997-12-24", blood: "O+", allergies: "None", phone: "+91 98487 89012" },
    { name: "Hima Das", gender: "FEMALE", dob: "2000-01-09", blood: "A+", allergies: "None", phone: "+91 98488 90123" },
    { name: "Viswanathan Anand", gender: "MALE", dob: "1969-12-11", blood: "B+", allergies: "None", phone: "+91 98489 01234" },
  ];

  const createdPatients: Array<{ id: string; name: string; mrn: string }> = [];

  for (let i = 0; i < patientNames.length; i++) {
    const p = patientNames[i];
    const mrn = `MRN-SYNTH-${(1001 + i).toString()}`;
    const patient = await prisma.patient.upsert({
      where: { mrn },
      update: {
        name: p.name,
        phone: p.phone,
        email: p.email || `patient${i + 1}@example.com`,
      },
      create: {
        mrn,
        userId: p.isUser ? demoPatientUser.id : null,
        name: p.name,
        dateOfBirth: new Date(p.dob),
        gender: p.gender as "MALE" | "FEMALE" | "OTHER",
        phone: p.phone,
        email: p.email || `patient${i + 1}@example.com`,
        bloodGroup: p.blood,
        allergies: p.allergies,
        address: `${10 + i}, MG Road, Ward ${Math.floor(i / 10) + 1}, Bangalore, KA 560001`,
        emergencyContact: `Relative: +91 98000 ${10000 + i}`,
      },
    });
    createdPatients.push({ id: patient.id, name: patient.name, mrn: patient.mrn });
  }
  console.log(`✅ ${createdPatients.length} Synthetic Patients seeded`);

  // 6. 30 Beds across Wards
  const wards = [
    { name: "General Ward A", count: 8 },
    { name: "General Ward B", count: 8 },
    { name: "ICU", count: 4 },
    { name: "Pediatric Ward", count: 5 },
    { name: "Post-Op Recovery", count: 5 },
  ];

  let bedIndex = 0;
  for (const ward of wards) {
    for (let b = 1; b <= ward.count; b++) {
      const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${b.toString().padStart(2, "0")}`;
      const isOccupied = bedIndex < 6;
      const isMaint = bedIndex === 12 || bedIndex === 25;

      const patientId = isOccupied ? createdPatients[bedIndex].id : null;
      const status = isOccupied ? "OCCUPIED" : isMaint ? "MAINTENANCE" : "AVAILABLE";

      await prisma.bed.upsert({
        where: { ward_number: { ward: ward.name, number: bedNumber } },
        update: {
          status: status as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",
          patientId,
          assignedAt: isOccupied ? new Date(Date.now() - (b * 86400000)) : null,
        },
        create: {
          ward: ward.name,
          number: bedNumber,
          status: status as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",
          patientId,
          assignedAt: isOccupied ? new Date(Date.now() - (b * 86400000)) : null,
        },
      });
      bedIndex++;
    }
  }
  console.log("✅ 30 Beds seeded across 5 wards");

  // 7. Appointments (past 30 days & next 7 days)
  const now = new Date();
  const demoPatientId = createdPatients[0].id;
  let apptCount = 0;

  // Past appointments for demo patient + others
  for (let dayOffset = 25; dayOffset >= 1; dayOffset -= 3) {
    const apptDate = new Date(now.getTime() - dayOffset * 86400000);
    apptDate.setHours(10, 0, 0, 0);
    const endsDate = new Date(apptDate.getTime() + 30 * 60000);

    const doc = doctorProfiles[apptCount % doctorProfiles.length];
    const patId = apptCount % 3 === 0 ? demoPatientId : createdPatients[apptCount % createdPatients.length].id;

    const appt = await prisma.appointment.upsert({
      where: {
        unique_doctor_slot: {
          doctorId: doc.id,
          startsAt: apptDate,
        },
      },
      update: {},
      create: {
        patientId: patId,
        doctorId: doc.id,
        departmentId: doc.deptId,
        startsAt: apptDate,
        endsAt: endsDate,
        status: "COMPLETED",
        reason: "Routine follow-up and clinical checkup",
        notes: "Patient attended on time, vitals reviewed.",
      },
    });
    apptCount++;

    // Create Encounter & Prescription for completed appointments
    const existingEnc = await prisma.encounter.findUnique({ where: { appointmentId: appt.id } });
    if (!existingEnc) {
      const enc = await prisma.encounter.create({
        data: {
          appointmentId: appt.id,
          patientId: patId,
          doctorId: doc.id,
          symptoms: "Mild headache, fatigue, occasional dizziness after exertion",
          diagnosis: "Mild Essential Hypertension - Stage 1",
          notes: "Advised low-sodium DASH diet, 30 min daily brisk walking, hydration.",
          vitals: {
            bp: "138/88 mmHg",
            pulse: "78 bpm",
            temp: "98.4 F",
            spo2: "99%",
            weight: "72 kg",
            height: "174 cm",
          },
          prescriptions: {
            create: [
              {
                medicine: "Telmisartan 40mg",
                dosage: "1 Tablet",
                frequency: "Once daily (Morning)",
                durationDays: 30,
                instructions: "Take after breakfast with water",
              },
              {
                medicine: "Vitamin D3 60k IU",
                dosage: "1 Capsule",
                frequency: "Once weekly",
                durationDays: 8,
                instructions: "Take with milk after meals",
              },
            ],
          },
        },
      });

      // Create Invoice for completed appointment
      const invNo = `INV-26${(apptCount + 100).toString()}`;
      await prisma.invoice.upsert({
        where: { invoiceNo: invNo },
        update: {},
        create: {
          invoiceNo: invNo,
          patientId: patId,
          appointmentId: appt.id,
          status: "PAID",
          subtotal: doc.fee,
          tax: Math.round(doc.fee * 0.18),
          total: Math.round(doc.fee * 1.18),
          paymentMethod: "UPI",
          paidAt: apptDate,
          items: {
            create: [
              {
                description: `Consultation Fee - ${doc.spec || "Specialist"}`,
                quantity: 1,
                unitPrice: doc.fee,
                amount: doc.fee,
              },
            ],
          },
        },
      });
    }
  }

  // Future appointments (next 7 days)
  for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
    const futureDate = new Date(now.getTime() + dayOffset * 86400000);
    futureDate.setHours(11, 30, 0, 0);
    const futureEnd = new Date(futureDate.getTime() + 30 * 60000);

    const doc = doctorProfiles[dayOffset % doctorProfiles.length];
    const patId = dayOffset === 2 ? demoPatientId : createdPatients[(dayOffset + 5) % createdPatients.length].id;

    await prisma.appointment.upsert({
      where: {
        unique_doctor_slot: {
          doctorId: doc.id,
          startsAt: futureDate,
        },
      },
      update: {},
      create: {
        patientId: patId,
        doctorId: doc.id,
        departmentId: doc.deptId,
        startsAt: futureDate,
        endsAt: futureEnd,
        status: "SCHEDULED",
        reason: "Cardiology follow-up and ECG review",
        notes: "Bring previous blood work and ECG traces.",
      },
    });
  }
  console.log("✅ Past and future appointments, encounters, prescriptions and invoices seeded");

  // 8. Pending invoices
  const pendingPatients = [createdPatients[1].id, createdPatients[2].id, demoPatientId];
  for (let p = 0; p < pendingPatients.length; p++) {
    const invNo = `INV-PENDING-0${p + 1}`;
    await prisma.invoice.upsert({
      where: { invoiceNo: invNo },
      update: {},
      create: {
        invoiceNo: invNo,
        patientId: pendingPatients[p],
        status: "PENDING",
        subtotal: 1200,
        tax: 216,
        total: 1416,
        items: {
          create: [
            { description: "Specialist Consultation", quantity: 1, unitPrice: 800, amount: 800 },
            { description: "Diagnostic Lab Work (CBC & Lipid)", quantity: 1, unitPrice: 400, amount: 400 },
          ],
        },
      },
    });
  }
  console.log("✅ Pending invoices seeded");

  // 9. Medical Report Metadata
  await prisma.medicalReport.upsert({
    where: { id: "report-synth-01" },
    update: {},
    create: {
      id: "report-synth-01",
      patientId: demoPatientId,
      uploadedById: admin.id,
      title: "Comprehensive Metabolic Panel & Lipid Profile",
      storagePath: "reports/patient_rohan_lipid_panel_2026.pdf",
      mimeType: "application/pdf",
      fileSize: 245760,
    },
  });

  await prisma.medicalReport.upsert({
    where: { id: "report-synth-02" },
    update: {},
    create: {
      id: "report-synth-02",
      patientId: createdPatients[1].id,
      uploadedById: admin.id,
      title: "Chest X-Ray Digital Radiograph PA View",
      storagePath: "reports/chest_xray_pa_view.png",
      mimeType: "image/png",
      fileSize: 1048576,
    },
  });
  console.log("✅ Medical Report metadata seeded");

  // 10. Audit Logs
  const auditEntries = [
    { action: "USER_LOGIN", entity: "User", entityId: admin.id, userId: admin.id },
    { action: "READ_PATIENT_LIST", entity: "Patient", userId: admin.id },
    { action: "CREATE_PATIENT", entity: "Patient", entityId: demoPatientId, userId: admin.id },
    { action: "BOOK_APPOINTMENT", entity: "Appointment", userId: admin.id },
    { action: "CREATE_ENCOUNTER", entity: "Encounter", userId: doctorProfiles[0].userId },
    { action: "GENERATE_INVOICE", entity: "Invoice", userId: admin.id },
    { action: "BED_ASSIGNMENT", entity: "Bed", userId: admin.id },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        ipAddress: "127.0.0.1",
        metadata: { source: "seed_system", environment: "demo" },
      },
    });
  }
  console.log("✅ Audit Logs seeded");

  console.log("\n=======================================================");
  console.log("🎉 MEDICLOUD DATABASE SEED COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("DEMO CREDENTIALS (All use password: Demo@123):");
  console.log(" 👑 ADMIN:        admin@medicloud.demo");
  console.log(" 🩺 DOCTOR:       doctor@medicloud.demo");
  console.log(" 📋 RECEPTIONIST: reception@medicloud.demo");
  console.log(" 👤 PATIENT:      patient@medicloud.demo");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
