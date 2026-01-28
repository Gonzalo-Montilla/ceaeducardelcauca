# Pagos Mixtos - Documentación

## Descripción
El sistema ahora soporta pagos mixtos, permitiendo que un estudiante pague con múltiples métodos de pago en una sola transacción. Por ejemplo: $500,000 en efectivo + $450,000 por Nequi = $950,000 total.

## Métodos de Pago Disponibles

### Métodos que entran a caja:
- **EFECTIVO**: Dinero físico
- **NEQUI**: Pago digital vía Nequi
- **DAVIPLATA**: Pago digital vía Daviplata
- **TRANSFERENCIA_BANCARIA**: Transferencia bancaria tradicional
- **TARJETA_DEBITO**: Pago con tarjeta débito
- **TARJETA_CREDITO**: Pago con tarjeta crédito

### Métodos de crédito (NO entran a caja):
- **CREDISMART**: Financiamiento CrediSmart - se trackea pero NO suma a totales de caja
- **SISTECREDITO**: Financiamiento Sistecredito - se trackea pero NO suma a totales de caja

## Backend - Estructura de Datos

### Pago Simple (un solo método)

```json
{
  "estudiante_id": 1,
  "monto": 950000,
  "metodo_pago": "EFECTIVO",
  "concepto": "Abono al curso",
  "referencia_pago": "REF-001",
  "observaciones": "Pago inicial",
  "es_pago_mixto": false
}
```

### Pago Mixto (múltiples métodos)

```json
{
  "estudiante_id": 1,
  "monto": 950000,
  "concepto": "Abono al curso",
  "observaciones": "Pago combinado",
  "es_pago_mixto": true,
  "detalles_pago": [
    {
      "metodo_pago": "EFECTIVO",
      "monto": 500000,
      "referencia": null
    },
    {
      "metodo_pago": "NEQUI",
      "monto": 450000,
      "referencia": "NEQUI-123456"
    }
  ]
}
```

### Validaciones:
1. Si `es_pago_mixto = true`, debe incluir al menos 2 detalles en `detalles_pago`
2. La suma de todos los `monto` en `detalles_pago` debe ser igual al `monto` total del pago
3. Si `es_pago_mixto = false`, debe especificar `metodo_pago`

## Backend - Respuesta

```json
{
  "id": 1,
  "estudiante_id": 1,
  "caja_id": 5,
  "concepto": "Abono al curso",
  "monto": 950000,
  "metodo_pago": null,
  "estado": "COMPLETADO",
  "fecha_pago": "2026-01-28T19:30:00",
  "es_pago_mixto": true,
  "detalles_pago": [
    {
      "id": 1,
      "metodo_pago": "EFECTIVO",
      "monto": 500000,
      "referencia": null
    },
    {
      "id": 2,
      "metodo_pago": "NEQUI",
      "monto": 450000,
      "referencia": "NEQUI-123456"
    }
  ],
  "estudiante_nombre": "Juan Pérez",
  "estudiante_matricula": "2024-001",
  "usuario_nombre": "María Rodríguez"
}
```

## Lógica de Caja

### Para pagos simples:
- El monto se suma a la columna correspondiente según el método de pago
- Efectivo → `total_ingresos_efectivo`
- Nequi/Daviplata/Transferencia → `total_ingresos_transferencia`
- Tarjetas → `total_ingresos_tarjeta`
- CrediSmart → `total_credismart` (NO suma a caja)
- Sistecredito → `total_sistecredito` (NO suma a caja)

### Para pagos mixtos:
- Cada detalle se suma individualmente a su columna correspondiente
- Ejemplo del pago de $950,000 (500k efectivo + 450k Nequi):
  - `total_ingresos_efectivo` += 500000
  - `total_ingresos_transferencia` += 450000
  - `total_ingresos` = suma de todos
  - `saldo_efectivo_caja` = solo el efectivo físico

## Frontend - Ejemplo de Implementación

### 1. Componente de Pago Simple

```typescript
const handlePagoSimple = async () => {
  const pagoData: PagoCreate = {
    estudiante_id: estudianteId,
    monto: 950000,
    metodo_pago: MetodoPago.EFECTIVO,
    concepto: "Abono al curso",
    es_pago_mixto: false
  };

  const response = await api.post('/api/v1/caja/pagos', pagoData);
  console.log('Pago registrado:', response.data);
};
```

### 2. Componente de Pago Mixto

```typescript
const [detalles, setDetalles] = useState<DetallePago[]>([
  { metodo_pago: MetodoPago.EFECTIVO, monto: 0 },
  { metodo_pago: MetodoPago.NEQUI, monto: 0 }
]);

const calcularTotal = () => {
  return detalles.reduce((sum, d) => sum + d.monto, 0);
};

const handlePagoMixto = async () => {
  const total = calcularTotal();
  
  const pagoData: PagoCreate = {
    estudiante_id: estudianteId,
    monto: total,
    concepto: "Abono al curso",
    es_pago_mixto: true,
    detalles_pago: detalles.filter(d => d.monto > 0) // Solo métodos usados
  };

  try {
    const response = await api.post('/api/v1/caja/pagos', pagoData);
    console.log('Pago mixto registrado:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.detail);
  }
};
```

### 3. UI Sugerida para Pagos Mixtos

```tsx
<div className="pago-mixto-form">
  <h3>Pago Mixto</h3>
  
  {detalles.map((detalle, index) => (
    <div key={index} className="detalle-pago">
      <select 
        value={detalle.metodo_pago}
        onChange={(e) => {
          const newDetalles = [...detalles];
          newDetalles[index].metodo_pago = e.target.value as MetodoPago;
          setDetalles(newDetalles);
        }}
      >
        <option value={MetodoPago.EFECTIVO}>Efectivo</option>
        <option value={MetodoPago.NEQUI}>Nequi</option>
        <option value={MetodoPago.DAVIPLATA}>Daviplata</option>
        <option value={MetodoPago.TRANSFERENCIA_BANCARIA}>Transferencia</option>
        <option value={MetodoPago.TARJETA_DEBITO}>Tarjeta Débito</option>
        <option value={MetodoPago.TARJETA_CREDITO}>Tarjeta Crédito</option>
        <option value={MetodoPago.CREDISMART}>CrediSmart</option>
        <option value={MetodoPago.SISTECREDITO}>Sistecredito</option>
      </select>
      
      <input
        type="number"
        value={detalle.monto}
        onChange={(e) => {
          const newDetalles = [...detalles];
          newDetalles[index].monto = parseFloat(e.target.value) || 0;
          setDetalles(newDetalles);
        }}
        placeholder="Monto"
      />
      
      <input
        type="text"
        value={detalle.referencia || ''}
        onChange={(e) => {
          const newDetalles = [...detalles];
          newDetalles[index].referencia = e.target.value;
          setDetalles(newDetalles);
        }}
        placeholder="Referencia (opcional)"
      />
      
      <button onClick={() => {
        setDetalles(detalles.filter((_, i) => i !== index));
      }}>
        Eliminar
      </button>
    </div>
  ))}
  
  <button onClick={() => {
    setDetalles([...detalles, { 
      metodo_pago: MetodoPago.EFECTIVO, 
      monto: 0 
    }]);
  }}>
    + Agregar método de pago
  </button>
  
  <div className="total">
    Total: ${calcularTotal().toLocaleString()}
  </div>
  
  <button onClick={handlePagoMixto}>
    Registrar Pago
  </button>
</div>
```

## Base de Datos

### Tabla: pagos
- Campo `es_pago_mixto`: 0 = pago simple, 1 = pago mixto
- Campo `metodo_pago`: NULL si es pago mixto, valor del enum si es simple

### Tabla: detalles_pago
- Se llena solo para pagos mixtos
- Cada fila representa un método de pago usado en el pago mixto
- Incluye: `metodo_pago`, `monto`, `referencia`

## Endpoints

### POST /api/v1/caja/pagos
Registra un pago (simple o mixto)

**Autorización**: Requiere rol ADMIN o COORDINADOR

**Body**: Ver ejemplos arriba

**Response**: PagoResponse con detalles completos

## Próximos Pasos

1. Implementar UI de pagos mixtos en el frontend
2. Agregar validación visual de suma de montos
3. Agregar vista de detalles de pagos mixtos en historial
4. Agregar reporte de pagos por método (incluyendo mixtos)
