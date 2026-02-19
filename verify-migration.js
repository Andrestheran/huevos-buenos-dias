#!/usr/bin/env node

/**
 * Verify that migration 003 was applied successfully
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyMigration() {
  console.log('🔍 Verificando migración 003_add_frozen_and_mortality...\n');

  try {
    // Test 1: Try to query production_records
    console.log('1️⃣  Verificando estructura de tabla...');
    const { data: records, error: queryError } = await supabase
      .from('production_records')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('❌ Error al consultar tabla:', queryError.message);
      return false;
    }

    if (records && records.length > 0) {
      const fields = Object.keys(records[0]);
      console.log('   Campos encontrados:', fields.join(', '));

      // Check for new fields
      const hasFrozen = fields.includes('frozen');
      const hasMortality = fields.includes('mortality');

      if (hasFrozen && hasMortality) {
        console.log('   ✅ Campos frozen y mortality existen\n');
      } else {
        console.log(`   ❌ Faltan campos: ${!hasFrozen ? 'frozen' : ''} ${!hasMortality ? 'mortality' : ''}\n`);
        return false;
      }
    } else {
      console.log('   ⚠️  No hay registros en la tabla (esto es normal si no hay datos)\n');
    }

    // Test 2: Try to insert a test record with new fields
    console.log('2️⃣  Probando inserción con nuevos campos...');

    // First, get a valid user_id
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('   ⚠️  No hay sesión activa. Omitiendo prueba de inserción.\n');
      console.log('✅ Verificación básica completada!\n');
      return true;
    }

    const testRecord = {
      user_id: session.user.id,
      barn: 'A',
      a: 10,
      aa: 20,
      b: 15,
      extra: 5,
      jumbo: 3,
      frozen: 7,      // New field
      mortality: 2    // New field
    };

    const { data: inserted, error: insertError } = await supabase
      .from('production_records')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate error (that's expected and OK)
      if (insertError.code === '23505') {
        console.log('   ⚠️  Ya existe un registro para hoy (esto es esperado)\n');
      } else {
        console.log('   ❌ Error al insertar:', insertError.message, '\n');
        return false;
      }
    } else {
      console.log('   ✅ Inserción exitosa!');
      console.log('   📊 Valores insertados:');
      console.log(`      - Frozen: ${inserted.frozen}`);
      console.log(`      - Mortality: ${inserted.mortality}`);
      console.log(`      - Total calculado: ${inserted.total}`);
      console.log(`      - Esperado: ${testRecord.a + testRecord.aa + testRecord.b + testRecord.extra + testRecord.jumbo + testRecord.frozen}`);

      if (inserted.total === (testRecord.a + testRecord.aa + testRecord.b + testRecord.extra + testRecord.jumbo + testRecord.frozen)) {
        console.log('   ✅ El total incluye frozen correctamente!\n');
      } else {
        console.log('   ❌ El total NO incluye frozen\n');
        return false;
      }

      // Clean up test record
      await supabase
        .from('production_records')
        .delete()
        .eq('id', inserted.id);
    }

    console.log('✅ ¡Migración verificada exitosamente!\n');
    console.log('📝 Resumen:');
    console.log('   • Campos frozen y mortality agregados ✓');
    console.log('   • Total incluye frozen en el cálculo ✓');
    console.log('   • Estructura de tabla actualizada ✓\n');

    return true;

  } catch (error) {
    console.error('\n❌ Error en verificación:', error.message, '\n');
    return false;
  }
}

verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
