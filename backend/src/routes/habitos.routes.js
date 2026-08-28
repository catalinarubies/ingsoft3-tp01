const express = require('express');
const router = express.Router();
const habitosService = require('../services/habitos.service');
const registrosService = require('../services/registros.service');

router.get('/', async (req, res) => {
  const habitos = await habitosService.listarHabitos();
  res.json(habitos);
});

router.post('/', async (req, res) => {
  try {
    const habito = await habitosService.crearHabito(req.body);
    res.status(201).json(habito);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/resumen', async (req, res) => {
  try {
    const resumen = await registrosService.obtenerResumen(req.params.id);
    res.json(resumen);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await habitosService.eliminarHabito(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.patch('/:id/archivar', async (req, res) => {
  try {
    const habito = await habitosService.archivarHabito(req.params.id);
    res.json(habito);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
