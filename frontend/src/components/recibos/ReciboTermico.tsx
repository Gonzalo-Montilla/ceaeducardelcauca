import '../../styles/ReciboTermico.css';

export interface ReciboTermicoDetalleMetodo {
  metodo: string;
  monto: number;
  referencia?: string | null;
}

export interface ReciboTermicoData {
  documento: string;
  id: number;
  fecha: string;
  concepto: string;
  categoria?: string | null;
  metodo_pago?: string | null;
  monto_total: number;
  es_pago_mixto?: boolean;
  detalles_metodo?: ReciboTermicoDetalleMetodo[];
  referencia_pago?: string | null;
  estudiante_nombre?: string | null;
  estudiante_documento?: string | null;
  estudiante_matricula?: string | null;
  tercero_nombre?: string | null;
  tercero_documento?: string | null;
  usuario_nombre?: string | null;
  observaciones?: string | null;
  empresa_nombre?: string | null;
  empresa_nit?: string | null;
  empresa_contacto?: string | null;
}

const THERMAL_PRINT_CSS = `
  @page { size: 80mm auto; margin: 2.5mm; }
  html, body {
    font-family: Arial, sans-serif;
    margin: 0 auto;
    width: 80mm;
    font-size: 11px;
    color: #111;
    line-height: 1.32;
  }
  .rt-wrap {
    width: 74mm;
    margin: 0 auto;
    padding: 2mm 1mm 1mm;
  }
  .rt-center { text-align: center; }
  .rt-logo {
    width: 30mm;
    max-width: 100%;
    max-height: 14mm;
    object-fit: contain;
    margin: 0 auto 1.5mm;
    display: block;
  }
  .rt-title { font-weight: 700; font-size: 15px; margin-bottom: 1px; }
  .rt-small { font-size: 10px; color: #2b2b2b; }
  .rt-sep { border-top: 1px dashed #333; margin: 7px 0; }
  .rt-section { margin: 5px 0 4px; }
  .rt-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.4px;
    margin-bottom: 2px;
  }
  .rt-section-title-center { text-align: center; }
  .rt-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin: 2px 0;
  }
  .rt-row .label { color: #2f2f2f; }
  .rt-row .value {
    text-align: right;
    font-weight: 600;
    max-width: 60%;
    word-break: break-word;
  }
  .rt-method { margin: 4px 0; padding: 2px 0 3px; border-bottom: 1px dotted #bbb; }
  .rt-total-box { margin-top: 3px; padding: 4px 0; border-top: 1px solid #222; border-bottom: 1px solid #222; }
  .rt-total { font-size: 14px; font-weight: 700; }
  .rt-footer { margin-top: 10px; text-align: center; font-size: 10px; }
  .rt-footer p { margin: 2px 0; }
`;

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (isoDate?: string | null) => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMetodoLabel = (metodo?: string | null) => {
  const labels: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    NEQUI: 'Nequi',
    NEQUI_ESCUELA: 'Nequi Escuela',
    NEQUI_GERENCIA: 'Nequi Gerencia',
    DAVIPLATA: 'Daviplata',
    BRE_B: 'Bre-B',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    TARJETA_DEBITO: 'Tarjeta Débito',
    TARJETA_CREDITO: 'Tarjeta Crédito',
    CREDISMART: 'CrediSmart',
    SISTECREDITO: 'Sistecredito',
  };
  return labels[String(metodo || '').toUpperCase()] || String(metodo || 'N/A');
};

export const buildReciboTermicoHtml = (data: ReciboTermicoData): string => {
  const logoUrl = `${window.location.origin}/logo-real.png`;
  const detalles = (data.detalles_metodo || [])
    .map(
      (d) => `
      <div class="rt-method">
        <div class="rt-row"><span class="label">${escapeHtml(formatMetodoLabel(d.metodo))}</span><span class="value">${escapeHtml(formatCurrency(d.monto))}</span></div>
        ${d.referencia ? `<div class="rt-small">Ref: ${escapeHtml(d.referencia)}</div>` : ''}
      </div>
    `
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Recibo Termico ${escapeHtml(data.id)}</title>
        <style>${THERMAL_PRINT_CSS}</style>
      </head>
      <body>
        <div class="rt-wrap">
          <div class="rt-center">
            <img class="rt-logo" src="${escapeHtml(logoUrl)}" alt="Logo CEA EDUCAR" onerror="this.style.display='none'" />
            <div class="rt-title">${escapeHtml(data.empresa_nombre || 'CEA EDUCAR')}</div>
            ${data.empresa_nit ? `<div class="rt-small">NIT ${escapeHtml(data.empresa_nit)}</div>` : ''}
            ${data.empresa_contacto ? `<div class="rt-small">${escapeHtml(data.empresa_contacto)}</div>` : ''}
            <div class="rt-sep"></div>
          </div>

          <div class="rt-center"><strong>${escapeHtml(data.documento)}</strong></div>
          <div class="rt-section">
            <div class="rt-section-title rt-section-title-center">DATOS RECIBO</div>
            <div class="rt-row"><span class="label">No.</span><span class="value">${escapeHtml(data.id)}</span></div>
            <div class="rt-row"><span class="label">Fecha</span><span class="value">${escapeHtml(formatDateTime(data.fecha))}</span></div>
            ${data.referencia_pago ? `<div class="rt-row"><span class="label">Referencia</span><span class="value">${escapeHtml(data.referencia_pago)}</span></div>` : ''}
          </div>

          <div class="rt-sep"></div>
          <div class="rt-section">
            <div class="rt-section-title rt-section-title-center">DETALLE</div>
            <div class="rt-row"><span class="label">Concepto</span><span class="value">${escapeHtml(data.concepto)}</span></div>
            ${data.categoria ? `<div class="rt-row"><span class="label">Categoria</span><span class="value">${escapeHtml(data.categoria)}</span></div>` : ''}
            ${data.estudiante_nombre ? `<div class="rt-row"><span class="label">Estudiante</span><span class="value">${escapeHtml(data.estudiante_nombre)}</span></div>` : ''}
            ${data.estudiante_documento ? `<div class="rt-row"><span class="label">Documento</span><span class="value">${escapeHtml(data.estudiante_documento)}</span></div>` : ''}
            ${data.estudiante_matricula ? `<div class="rt-row"><span class="label">Matricula</span><span class="value">${escapeHtml(data.estudiante_matricula)}</span></div>` : ''}
            ${data.tercero_nombre ? `<div class="rt-row"><span class="label">Tercero</span><span class="value">${escapeHtml(data.tercero_nombre)}</span></div>` : ''}
            ${data.tercero_documento ? `<div class="rt-row"><span class="label">Doc tercero</span><span class="value">${escapeHtml(data.tercero_documento)}</span></div>` : ''}
          </div>

          <div class="rt-sep"></div>
          <div class="rt-section">
            <div class="rt-section-title rt-section-title-center">METODO DE PAGO</div>
            ${
              data.es_pago_mixto
                ? `<div><strong>Pago mixto</strong></div>${detalles}`
                : `<div class="rt-row"><span class="label">Metodo</span><span class="value">${escapeHtml(formatMetodoLabel(data.metodo_pago))}</span></div>`
            }
          </div>

          <div class="rt-total-box">
            <div class="rt-row rt-total"><span>TOTAL</span><span>${escapeHtml(formatCurrency(data.monto_total))}</span></div>
          </div>

          ${data.usuario_nombre ? `<div class="rt-row"><span class="label">Atendio</span><span class="value">${escapeHtml(data.usuario_nombre)}</span></div>` : ''}
          ${data.observaciones ? `<div class="rt-small">Obs: ${escapeHtml(data.observaciones)}</div>` : ''}

          <div class="rt-sep"></div>
          <div class="rt-footer">
            <p>Gracias por su pago</p>
            <p>Este comprobante también fue enviado a su correo electrónico.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const printReciboTermico = (data: ReciboTermicoData) => {
  const win = window.open('', '_blank', 'width=420,height=800');
  if (!win) {
    throw new Error('No se pudo abrir la ventana de impresion');
  }

  win.document.open();
  win.document.write(buildReciboTermicoHtml(data));
  win.document.close();
  win.focus();

  setTimeout(() => {
    win.print();
  }, 250);
};

type Props = { data: ReciboTermicoData };

export const ReciboTermico = ({ data }: Props) => (
  <div className="recibo-termico-preview">
    <h3>{data.empresa_nombre || 'CEA EDUCAR'}</h3>
    <p>{data.documento} #{data.id}</p>
    <p>{data.concepto}</p>
    <strong>{formatCurrency(data.monto_total)}</strong>
  </div>
);

