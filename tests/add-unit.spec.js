
const { test, expect } = require('@playwright/test');
const fs = require('fs');
require('dotenv').config();

test('LP-02: Add a unit to a project', async ({ page }) => {
  test.setTimeout(120000);
  fs.mkdirSync('test-results', { recursive: true });

  const nombreProyecto = 'Proyecto QA Automatizado 1792609745160';

  // 1. INICIAR SESIÓN
  await page.goto('https://tst.lebane.app');

  await page.locator('input[name="email"]').fill(process.env.QA_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.QA_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(
    page.getByText('Proyectos Desarrollo', { exact: true })
  ).toBeVisible({ timeout: 20000 });

  // 2. BUSCAR Y ABRIR EL PROYECTO
  const buscar = page.getByPlaceholder(/buscar/i).first();

  if (await buscar.isVisible().catch(() => false)) {
    await buscar.fill(nombreProyecto);
    await page.waitForTimeout(1000);
  }

  await page.getByText(nombreProyecto, { exact: true }).last().click();
  await page.waitForTimeout(1500);

  console.log('Proyecto abierto:', nombreProyecto);

  // 3. ABRIR EL MENÚ LATERAL
  const botonDesplegar = page.locator(
    'button[data-cy="expandMenu"]'
  );

  await expect(botonDesplegar).toBeVisible({ timeout: 10000 });
  await botonDesplegar.click();
  await page.waitForTimeout(1000);

  // 4. DESPLEGAR CLIENTES
  const clientes = page.getByText('Clientes', { exact: true });

  let clientesVisible = null;

  for (let i = 0; i < await clientes.count(); i++) {
    if (await clientes.nth(i).isVisible().catch(() => false)) {
      clientesVisible = clientes.nth(i);
      break;
    }
  }

  if (!clientesVisible) {
    throw new Error('No se encontró visible la sección Clientes.');
  }

  const filaClientes = clientesVisible.locator(
    'xpath=ancestor::div[contains(@class,"fuse-list-item")]'
  ).first();

  if (await filaClientes.count()) {
    await filaClientes.click();
  } else {
    await clientesVisible.click();
  }

  await page.waitForTimeout(1000);

  // 5. ENTRAR A UNIDADES
  const enlacesUnidades = page.locator('a[href$="/areas"]');
  let enlaceEncontrado = false;

  for (let intento = 0; intento < 10; intento++) {
    for (let i = 0; i < await enlacesUnidades.count(); i++) {
      const enlace = enlacesUnidades.nth(i);

      if (await enlace.isVisible().catch(() => false)) {
        await enlace.click();
        enlaceEncontrado = true;
        break;
      }
    }

    if (enlaceEncontrado) break;
    await page.waitForTimeout(500);
  }

  if (!enlaceEncontrado) {
    throw new Error('El enlace Unidades no está visible.');
  }

  await page.waitForTimeout(1500);

  // 6. VERIFICAR EL FORMULARIO
  await expect(
    page.getByText(/Precio lista M2/i).last()
  ).toBeVisible({ timeout: 15000 });

  console.log('Formulario de unidad abierto.');

  // 7. COMPLETAR PRECIO POR M2
  const precioM2 = page.getByLabel(/Precio lista M2/i).last();

  await expect(precioM2).toBeVisible({ timeout: 10000 });
  await precioM2.fill('1000');

  console.log('Precio lista M2: 1000');

  // 8. COMPLETAR CANTIDAD DE PISOS
  const pisos = page.getByLabel(/Cantidad de pisos/i).last();

  await expect(pisos).toBeVisible({ timeout: 10000 });
  await pisos.fill('1');

  console.log('Cantidad de pisos: 1');

  // 9. COMPLETAR CANTIDAD DE SUBSUELOS SI EL CAMPO ESTÁ DISPONIBLE
  const subsuelos = page.getByLabel(/Cantidad de subsuelos/i).last();

  if (await subsuelos.isVisible().catch(() => false)) {
    await subsuelos.fill('0');
    console.log('Cantidad de subsuelos: 0');
  }

  // 10. COMPLETAR UNIDADES POR PISO
  const unidadesPorPiso = page.getByLabel(/Unidades por piso/i).last();

  await expect(unidadesPorPiso).toBeVisible({ timeout: 10000 });
  await unidadesPorPiso.fill('1');

  console.log('Unidades por piso: 1');

  // 11. SELECCIONAR TIPOLOGÍA COCHERA
  const tipologias = page.getByLabel(/Tipologias/i).last();

  await expect(tipologias).toBeVisible({ timeout: 10000 });
  await tipologias.click();

  const opcionCochera = page.getByRole('option', {
    name: 'Cochera',
    exact: true,
  }).last();

  if (await opcionCochera.isVisible().catch(() => false)) {
    await opcionCochera.click();
  } else {
    const textoCochera = page.getByText('Cochera', {
      exact: true,
    }).last();

    await expect(textoCochera).toBeVisible({ timeout: 10000 });
    await textoCochera.click();
  }

  console.log('Tipología seleccionada: Cochera');

  // 12. TOMAR CAPTURA ANTES DE GUARDAR
  await page.screenshot({
    path: 'test-results/lp02-antes-de-guardar.png',
    fullPage: true,
  });

  // 13. GUARDAR
  const guardar = page.getByRole('button', {
    name: 'Guardar',
    exact: true,
  }).last();

  await expect(guardar).toBeVisible({ timeout: 10000 });
  await expect(guardar).toBeEnabled({ timeout: 10000 });

  await guardar.click();

  console.log('Se hizo clic en Guardar.');

  // 14. ESPERAR EL RESULTADO Y GUARDAR EVIDENCIA
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: 'test-results/lp02-despues-de-guardar.png',
    fullPage: true,
  });

  const resultado = await page.locator('body').innerText();

  console.log('CONTENIDO DESPUÉS DE GUARDAR:');
  console.log(resultado.slice(0, 8000));

  console.log('URL final:', page.url());
  console.log('Capturas guardadas en test-results/.');

  // Si el formulario sigue abierto, probablemente no se guardó.
  const formularioSigueAbierto = await page
    .getByText(/Precio lista M2/i)
    .last()
    .isVisible()
    .catch(() => false);

  if (formularioSigueAbierto) {
    console.log(
      'ATENCIÓN: el formulario sigue visible después de guardar. ' +
      'Revisar el mensaje de validación y la captura.'
    );
  } else {
    console.log(
      'El formulario dejó de estar visible después de guardar.'
    );
  }
});
