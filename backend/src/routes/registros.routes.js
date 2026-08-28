const express = require('express');
const router = express.Router();
const registrosService = require('../services/registros.service');

// Se registra un valor para un hábito en una fecha dada.
// Body: { habitoId, fecha: 'YYYY-MM-DD', valor: number }
router.post('/', async (req, res) => {
  try {
    const { habitoId, fecha, valor } = req.body;
    const registro = await registrosService.registrarValor({ habitoId, fecha, valor });
    res.status(201).json(registro);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
