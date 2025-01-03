const { Pool } = require('pg');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurare conexiune PostgreSQL
const pool = new Pool({
    connectionString: 'postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

app.use(express.json());

app.post('/save-data', async (req, res) => {
    const data = req.body;

    if (Object.keys(data).length !== 14) {
        return res.status(400).json({ message: 'Trebuie să trimiți exact 14 câmpuri.' });
    }

    try {
        const query = `
            INSERT INTO my_table (field1, field2, field3, field4, field5, field6, field7, field8, field9, field10, field11, field12, field13, field14)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        const values = Object.values(data);

        await pool.query(query, values);
        res.status(201).json({ message: 'Datele au fost salvate cu succes.' });
    } catch (error) {
        console.error('Eroare la salvarea datelor:', error);
        res.status(500).json({ message: 'Eroare la salvarea datelor.', error });
    }
});

app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
