
const { Pool } = require("pg");
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/cyberplace";
const pool = new Pool({ connectionString: databaseUrl });

async function checkShadow() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nickname, u.points, 
             (SELECT SUM(t.points) FROM ctf_attempts a JOIN ctf_tasks t ON a.ctf_id = t.id WHERE a.user_id = u.id AND a.solved = true) as ctf_points,
             (SELECT SUM(l.points) FROM user_lesson_attempts la JOIN lessons l ON la.lesson_id = l.id WHERE la.user_id = u.id AND la.status = 'completed') as lesson_points
      FROM users u
      WHERE u.nickname ILIKE 'SHADOW'
    `);
    console.log(JSON.stringify(result.rows, null, 2));
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkShadow();
