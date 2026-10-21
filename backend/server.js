// Backend for the course website. Data lives in plain JSON files, no database.
//   data/departments.json        -> home page + department list (names, about text, image, colour)
//   data/curriculum/<id>.json    -> syllabus of one department, e.g. cse.json
// The files are read on every request, so edit a JSON file, save, refresh the browser. No restart needed.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;
const DATA = path.join(__dirname, 'data');

app.use(express.json());

// let the Angular site (localhost:4200) call this API
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Backend connected' });
});

// home page settings + list of departments (+ whether each has a syllabus file)
app.get('/api/departments', (_req, res) => {
  try {
    const data = readJson(path.join(DATA, 'departments.json'));
    data.departments = data.departments.map((d) => ({
      ...d,
      hasSyllabus: fs.existsSync(path.join(DATA, 'curriculum', `${d.id.toLowerCase()}.json`)),
    }));
    res.json(data);
  } catch (err) {
    console.error('departments.json problem:', err.message);
    res.status(500).json({ error: 'departments.json is missing or has a JSON mistake', detail: err.message });
  }
});

// full syllabus of one department
app.get('/api/departments/:id/curriculum', (req, res) => {
  const id = req.params.id;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return res.status(400).json({ error: 'bad department id' });

  const file = path.join(DATA, 'curriculum', `${id.toLowerCase()}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: `No syllabus file for ${id} yet` });

  try {
    res.json(readJson(file));
  } catch (err) {
    console.error(`${id} curriculum problem:`, err.message);
    res.status(500).json({ error: `${id.toLowerCase()}.json has a JSON mistake`, detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
