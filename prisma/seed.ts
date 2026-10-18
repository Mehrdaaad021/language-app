import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const sara = await prisma.student.create({
        data: { name: "سارا محمدی", phone: "09120004567", level: "B1", term: "ترم دوم", active: true },
    });
    const ali = await prisma.student.create({
        data: { name: "علی رضایی", phone: "09350001234", level: "A2", term: "ترم اول", active: true },
    });
    const maryam = await prisma.student.create({
        data: { name: "مریم کریمی", phone: "09190008901", level: "C1", term: "ترم سوم", active: true },
    });
    const reza = await prisma.student.create({
        data: { name: "رضا نادری", phone: "09220005678", level: "A1", term: "ترم اول", active: false },
    });

    await prisma.session.createMany({
        data: [
            { studentId: sara.id, date: new Date("2026-04-13T17:00:00.000Z"), topic: "Past Tense", status: "SCHEDULED" },
            { studentId: ali.id, date: new Date("2026-04-14T18:30:00.000Z"), topic: "Speaking: Travel", status: "SCHEDULED" },
            { studentId: maryam.id, date: new Date("2026-04-15T17:00:00.000Z"), topic: "IELTS Writing", status: "SCHEDULED" },
            { studentId: sara.id, date: new Date("2026-04-06T17:00:00.000Z"), topic: "Conditionals", status: "COMPLETED" },
            { studentId: reza.id, date: new Date("2026-04-05T16:00:00.000Z"), topic: "Alphabet Review", status: "CANCELLED" },
        ],
    });

    await prisma.payment.createMany({
        data: [
            { studentId: sara.id, amount: 4000000, date: new Date("2026-03-30T00:00:00.000Z"), status: "PAID" },
            { studentId: ali.id, amount: 3500000, date: new Date("2026-03-28T00:00:00.000Z"), status: "PAID" },
            { studentId: maryam.id, amount: 4500000, date: new Date("2026-03-25T00:00:00.000Z"), status: "PAID" },
            { studentId: reza.id, amount: 3000000, date: new Date("2026-03-25T00:00:00.000Z"), status: "PENDING" },
        ],
    });

    await prisma.note.createMany({
        data: [
            {
                studentId: sara.id,
                title: "خلاصه‌ی گرامر جلسه‌ی ۴",
                content: "شرطی‌های نوع دوم:\nIf + past simple → would + verb\n\nمثال:\nIf I had time, I would travel.\n\nتکلیف: ۱۰ جمله با این ساختار بنویس.",
                date: new Date("2026-04-07T00:00:00.000Z"),
            },
            {
                studentId: ali.id,
                title: "لغات جدید: سفر",
                content: "itinerary: سفرنامه\nlayover: توقف بین پرواز\nbaggage claim: محل تحویل چمدان\ncustoms: گمرک\n\nهر لغت را در یک جمله به کار ببر.",
                date: new Date("2026-04-04T00:00:00.000Z"),
            },
            {
                studentId: maryam.id,
                title: "بازخورد رایتینگ آیلتس",
                content: "نمره‌ی تخمینی: ۶.۵\n\nنقاط قوت: واژگان غنی\nنیاز به بهبود: پاراگراف‌بندی شفاف‌تر و thesis statement در مقدمه.",
                date: new Date("2026-04-01T00:00:00.000Z"),
            },
        ],
    });

    console.log("🌱 Seed completed: 4 students, 5 sessions, 4 payments, 3 notes");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());