// Fills an empty database with an admin account and sample products.
// Run with: pnpm db:seed   (safe to run more than once)
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { db, pool } from "./db/index.js";
import { products, users } from "./db/schema.js";
import { env } from "./env.js";

const sampleProducts = [
  ["كتاب أساسيات تطوير الويب", "كتب إلكترونية", "12.00", "كتاب إلكتروني يشرح HTML و CSS و JavaScript من الصفر مع أمثلة عملية."],
  ["دليل تعلم قواعد البيانات", "كتب إلكترونية", "9.50", "دليل مبسط لتصميم قواعد البيانات العلائقية وكتابة استعلامات SQL."],
  ["كتاب مدخل إلى الخوارزميات", "كتب إلكترونية", "15.00", "شرح مبسط لأشهر الخوارزميات وهياكل البيانات مع تمارين محلولة."],
  ["ملخص تصميم تجربة المستخدم", "كتب إلكترونية", "7.00", "ملخص عملي لمبادئ تصميم الواجهات وتجربة المستخدم."],
  ["قالب سيرة ذاتية احترافي", "قوالب تصميم", "5.00", "قالب سيرة ذاتية جاهز للتعديل يدعم العربية والإنجليزية."],
  ["حزمة قوالب منشورات التواصل", "قوالب تصميم", "14.00", "ثلاثون قالبًا لمنشورات وسائل التواصل الاجتماعي قابلة للتخصيص."],
  ["قالب عرض تقديمي للمشاريع", "قوالب تصميم", "8.00", "قالب عرض تقديمي أنيق من عشرين شريحة لمشاريع التخرج."],
  ["حزمة أيقونات واجهات", "قوالب تصميم", "6.50", "مئتا أيقونة بصيغة SVG لواجهات المواقع والتطبيقات."],
  ["قالب لوحة تحكم React", "أكواد برمجية", "29.00", "قالب لوحة تحكم مبني بـ React و Tailwind CSS مع صفحات جاهزة."],
  ["واجهة API جاهزة بـ Express", "أكواد برمجية", "19.00", "مشروع Express.js جاهز يتضمن المصادقة والتحقق من الصلاحيات."],
  ["مكتبة مكونات واجهة", "أكواد برمجية", "11.00", "مجموعة مكونات واجهة قابلة لإعادة الاستخدام مع أمثلة."],
  ["سكربتات أتمتة للمطورين", "أكواد برمجية", "4.00", "مجموعة سكربتات لتسريع المهام اليومية المتكررة."],
  ["حزمة مؤثرات صوتية للواجهات", "مؤثرات صوتية", "6.00", "خمسون مؤثرًا صوتيًا قصيرًا للأزرار والتنبيهات."],
  ["موسيقى خلفية هادئة", "مؤثرات صوتية", "10.00", "عشر مقطوعات موسيقية هادئة لمقاطع الفيديو والعروض."],
  ["مؤثرات صوتية للألعاب", "مؤثرات صوتية", "13.00", "مئة مؤثر صوتي متنوع لألعاب الهاتف والحاسوب."],
] as const;

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Admin: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD in .env).");
    return;
  }

  const created = await db
    .insert(users)
    .values({ name: "مشرف المتجر", email, passwordHash: await bcrypt.hash(password, 10), role: "admin" })
    .onConflictDoNothing({ target: users.email })
    .returning();
  console.log(created.length ? `Admin: created ${email}.` : `Admin: ${email} already exists.`);
}

async function seedProducts() {
  const [{ total }] = await db.select({ total: count() }).from(products);
  if (total > 0) {
    console.log(`Products: skipped (${total} already in the database).`);
    return;
  }

  fs.mkdirSync(env.storageDir, { recursive: true });
  const rows = sampleProducts.map(([title, category, price, description], index) => {
    // A small placeholder file stands in for the real product file.
    const fileKey = `sample-${index + 1}.txt`;
    fs.writeFileSync(
      path.join(env.storageDir, fileKey),
      `رَقْمي — ملف تجريبي\n\nالمنتج: ${title}\nالتصنيف: ${category}\n`,
    );
    return {
      title,
      category,
      price,
      description,
      imageUrl: `https://picsum.photos/seed/raqami-${index + 1}/600/400`,
      fileKey,
      fileName: `${title}.txt`,
    };
  });

  await db.insert(products).values(rows);
  console.log(`Products: created ${rows.length} with sample files.`);
}

await seedAdmin();
await seedProducts();
await pool.end();
