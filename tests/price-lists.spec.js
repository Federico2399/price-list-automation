
const { test, expect } = require('@playwright/test');
const fs = require('fs');
require('dotenv').config();

test('LP-01: Create a project with its initial price list', async ({ page }) => {
  test.setTimeout(120000);

  const id = Date.now();
  const proyecto = `Proyecto QA Automatizado ${id}`;
  const razonSocial = `Empresa QA Automatizada ${id}`;
  const numeroDNI = String(id).slice(-8);

  fs.mkdirSync('test-results', { recursive: true });

  await page.goto('https://tst.lebane.app');

  // 1. LOGIN
  await page.locator('input[name="email"]').fill(process.env.QA_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.QA_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // 2. ABRIR FORMULARIO DE PROYECTO
  const agregarProyecto = page.getByText('Agregar proyecto', {
    exact: true,
  });

  await expect(agregarProyecto).toBeVisible({ timeout: 20000 });
  await agregarProyecto.click();

  const nombreProyecto = page.locator('input[name="nombreProyecto"]');
  await expect(nombreProyecto).toBeVisible({ timeout: 15000 });

  // 3. FUNCIÓN PARA SELECCIONAR OPCIONES
  async function seleccionarOpcion(indice, valor) {
    const combo = page.getByRole('combobox').nth(indice);

    console.log(`Seleccionando "${valor}" en el desplegable ${indice}`);
    await combo.click();

    const escapado = valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const opcion = page.getByRole('option', {
      name: new RegExp(`^${escapado}$`, 'i'),
    }).last();

    if (await opcion.isVisible().catch(() => false)) {
      await opcion.click();
      return;
    }

    await combo.fill(valor);
    await expect(opcion).toBeVisible({ timeout: 10000 });
    await opcion.click();
  }

  // 4. DATOS DEL PROYECTO
  await nombreProyecto.fill(proyecto);

  await seleccionarOpcion(0, 'ARS');
  await seleccionarOpcion(1, 'Argentina');
  await seleccionarOpcion(2, 'Capital Federal');
  await seleccionarOpcion(3, 'Palermo');

  // Jurisdicción (IIBB)
  const jurisdiccion = page.getByRole('combobox').nth(4);
  await jurisdiccion.click();

  const opcionCABA = page.getByRole('option', {
    name: 'Ciudad Autónoma de Buenos Aires (CABA)',
    exact: true,
  }).last();

  if (await opcionCABA.isVisible().catch(() => false)) {
    await opcionCABA.click();
  } else {
    const textoCABA = page.getByText(
      'Ciudad Autónoma de Buenos Aires (CABA)',
      { exact: true }
    ).last();

    await expect(textoCABA).toBeVisible({ timeout: 10000 });
    await textoCABA.click();
  }

  // Tipo de cambio automático
  const automatico = page.getByLabel(/definir automáticamente/i);

  if (await automatico.count()) {
    if (!(await automatico.isChecked())) {
      await automatico.check();
    }
  }

  // Dirección
  await page.locator('input[name="calle"]').fill('Calle de prueba');
  await page.locator('input[name="numeroPuerta"]').fill('123');

  // Fechas del proyecto
  const fechasProyecto = page.getByPlaceholder('DD/MM/YYYY');
  await expect(fechasProyecto).toHaveCount(2, { timeout: 10000 });

  const fechaInicio = fechasProyecto.nth(0);
  const fechaFin = fechasProyecto.nth(1);

  await fechaInicio.fill('20/10/2026');
  await fechaInicio.press('Tab');
  await expect(fechaInicio).toHaveValue('20/10/2026');

  await fechaFin.fill('20/10/2027');
  await fechaFin.press('Tab');
  await expect(fechaFin).toHaveValue('20/10/2027');

  // Tipo de construcción y modalidad de ajuste
  await seleccionarOpcion(5, 'Casa');
  await seleccionarOpcion(6, 'Provisorio');

  // 5. RAZÓN SOCIAL
  const selectorRazonSocial = page.getByPlaceholder(
    'Escribí para buscar o crear'
  );

  await selectorRazonSocial.fill(razonSocial);

  const escapadoRS = razonSocial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opcionRazonSocial = page.getByRole('option', {
    name: new RegExp(escapadoRS),
  }).last();

  await expect(opcionRazonSocial).toBeVisible({ timeout: 10000 });
  await opcionRazonSocial.click();

  const nombreRS = page.locator('input[name="nombreRazonSocial"]');

  if (await nombreRS.count()) {
    if (!(await nombreRS.inputValue()).trim()) {
      await nombreRS.fill(razonSocial);
    }
  }

  // Descripción
  const campoDescripcion = page.locator('textarea[name="descripcion"]');

  if (await campoDescripcion.count()) {
    await campoDescripcion.fill(razonSocial);
    await campoDescripcion.press('Tab');
  }

  // 6. FECHA DE REGISTRO
  const todasLasFechas = page.getByPlaceholder('DD/MM/YYYY');
  await expect(todasLasFechas).toHaveCount(3, { timeout: 10000 });

  const fechaRegistro = todasLasFechas.nth(2);

  if (!(await fechaRegistro.inputValue()).trim()) {
    await fechaRegistro.fill('21/10/2026');
    await fechaRegistro.press('Tab');
  }

  // 7. TIPO DE DOCUMENTO: DNI
  console.log('Seleccionando tipo de documento DNI...');

  const tipoDocumento = page.getByPlaceholder('Seleccionar').last();
  await expect(tipoDocumento).toBeVisible({ timeout: 10000 });
  await tipoDocumento.click();

  const opcionDNI = page.getByRole('option', {
    name: 'DNI',
    exact: true,
  }).last();

  if (await opcionDNI.isVisible().catch(() => false)) {
    await opcionDNI.click();
  } else {
    const textoDNI = page.getByText('DNI', { exact: true }).last();
    await expect(textoDNI).toBeVisible({ timeout: 10000 });
    await textoDNI.click();
  }

  // 8. NÚMERO DE DNI
  const campoDNI = page.locator(
    'input[name="documentoDeIdentidadNumero"]'
  );

  await expect(campoDNI).toBeVisible({ timeout: 10000 });
  await campoDNI.fill(numeroDNI);
  await campoDNI.press('Tab');

  console.log('Proyecto:', proyecto);
  console.log('Razón social:', razonSocial);
  console.log('Tipo de documento: DNI');
  console.log('Número de documento de prueba:', numeroDNI);

  // 9. REGISTRAR PROYECTO
  const registrar = page.getByRole('button', {
    name: 'Registrar',
    exact: true,
  });

  await expect(registrar).toBeVisible({ timeout: 10000 });
  await expect(registrar).toBeEnabled({ timeout: 10000 });

  await registrar.click();
  await page.waitForTimeout(3000);

  // 10. EVIDENCIA DEL RESULTADO
  const textoPantalla = await page.locator('body').innerText();

  console.log('CONTENIDO DESPUÉS DE REGISTRAR:');
  console.log(textoPantalla.slice(0, 12000));

  await page.screenshot({
    path: 'test-results/lp01-despues-de-registrar.png',
    fullPage: true,
  });

  // Detectar error de documento duplicado
  if (
    /ya existe una razón social.*organización.*número y tipo de documento/i
      .test(textoPantalla)
  ) {
    throw new Error(
      `La aplicación rechazó el documento ${numeroDNI} por duplicado. ` +
      'Revisar test-results/lp01-despues-de-registrar.png'
    );
  }

  // Verificar que no permanezca en el formulario de registro
  await expect(registrar).not.toBeVisible({ timeout: 15000 });

  console.log('URL después del registro:', page.url());
  console.log(
    'Evidencia guardada en test-results/lp01-despues-de-registrar.png'
  );
  console.log('Proyecto registrado:', proyecto);
  console.log(
    'Pendiente: verificar explícitamente la creación de la lista de precios inicial.'
  );
});
