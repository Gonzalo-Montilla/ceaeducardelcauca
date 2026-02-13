import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { estudiantesAPI } from '../services/api';
import { Camera, RotateCcw, Check, UserPlus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import '../styles/NuevoEstudiante.css';

export const NuevoEstudiante = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aceptaHabeas, setAceptaHabeas] = useState(false);
  const MAX_IMAGE_SIZE_MB = 2;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const MAX_BASE64_LENGTH = 3_000_000;

  // Datos personales
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');
  const [eps, setEps] = useState('');
  const [ocupacion, setOcupacion] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [nivelEducativo, setNivelEducativo] = useState('');
  const [estrato, setEstrato] = useState('');
  const [nivelSisben, setNivelSisben] = useState('');
  const [necesidadesEspeciales, setNecesidadesEspeciales] = useState('');
  
  // Contacto de emergencia
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState('');
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState('');
  
  // Captura de foto
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [mostrarWebcam, setMostrarWebcam] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`La imagen no debe superar ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }
    
    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (base64String.length > MAX_BASE64_LENGTH) {
        setError('La imagen es demasiado grande. Usa una más liviana.');
        return;
      }
      console.log('Foto cargada, tamaño:', base64String.length, 'caracteres');
      setFotoCapturada(base64String);
    };
    reader.onerror = () => {
      setError('Error al leer la imagen');
    };
    reader.readAsDataURL(file);
  };
  
  const abrirArchivo = () => {
    fileInputRef.current?.click();
  };
  
  const iniciarWebcam = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      streamRef.current = stream;
      setMostrarWebcam(true);
      
      // Esperar un poco antes de asignar el stream
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setError('No se pudo acceder a la webcam. Verifica los permisos.');
      setMostrarWebcam(false);
    }
  };
  
  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imagenBase64 = canvas.toDataURL('image/jpeg', 0.75);
        if (imagenBase64.length > MAX_BASE64_LENGTH) {
          setError('La imagen es demasiado grande. Intenta nuevamente.');
          return;
        }
        setFotoCapturada(imagenBase64);
        detenerWebcam();
      }
    }
  };
  
  const detenerWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setMostrarWebcam(false);
  };
  
  const recapturarFoto = () => {
    setFotoCapturada(null);
    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const soloDigitos = (value: string) => value.replace(/\D/g, '');

  useEffect(() => {
    return () => {
      detenerWebcam();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar que la foto esté capturada
    if (!fotoCapturada) {
      setError('Debe capturar la fotografía del estudiante');
      return;
    }
    
    const cedulaLimpia = soloDigitos(cedula);
    const telefonoLimpio = soloDigitos(telefono);
    const telefonoEmergenciaLimpio = soloDigitos(contactoEmergenciaTelefono);

    if (cedula && cedula !== cedulaLimpia) {
      setError('La cédula solo debe contener números');
      return;
    }
    if (cedulaLimpia.length < 5 || cedulaLimpia.length > 20) {
      setError('La cédula debe tener entre 5 y 20 dígitos');
      return;
    }
    if (telefono && telefono !== telefonoLimpio) {
      setError('El teléfono solo debe contener números');
      return;
    }
    if (telefonoLimpio.length < 7 || telefonoLimpio.length > 15) {
      setError('El teléfono debe tener entre 7 y 15 dígitos');
      return;
    }
    if (contactoEmergenciaTelefono && contactoEmergenciaTelefono !== telefonoEmergenciaLimpio) {
      setError('El teléfono de emergencia solo debe contener números');
      return;
    }
    if (fotoCapturada.length > MAX_BASE64_LENGTH) {
      setError('La imagen es demasiado grande. Usa una más liviana.');
      return;
    }
    if (!aceptaHabeas) {
      setError('Debes aceptar el tratamiento de datos personales');
      return;
    }

    setIsLoading(true);

    try {
      // Preparar datos para enviar
      const estudianteData = {
        // Datos de usuario
        email: email.trim(),
        password: cedula, // Usar cédula como contraseña inicial
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim() || null,
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || null,
        cedula: cedulaLimpia,
        telefono: telefonoLimpio,
        
        // Datos personales
        fecha_nacimiento: fechaNacimiento,
        direccion: direccion || null,
        ciudad: ciudad || null,
        barrio: barrio || null,
        tipo_sangre: tipoSangre || null,
        eps: eps || null,
        ocupacion: ocupacion || null,
        estado_civil: estadoCivil || null,
        nivel_educativo: nivelEducativo || null,
        estrato: estrato ? parseInt(estrato) : null,
        nivel_sisben: nivelSisben || null,
        necesidades_especiales: necesidadesEspeciales || null,
        
        // Contacto de emergencia
        contacto_emergencia_nombre: contactoEmergenciaNombre.trim() || null,
        contacto_emergencia_telefono: telefonoEmergenciaLimpio || null,
        
        // Foto en base64
        foto_base64: fotoCapturada,
        autorizacion_tratamiento: aceptaHabeas
      };
      
      // Llamar a la API
      const resultado = await estudiantesAPI.create(estudianteData);
      
      console.log('Estudiante creado:', resultado);
      
      // Navegar al dashboard o mostrar mensaje de éxito
      alert('Estudiante registrado exitosamente. Matrícula: ' + resultado.matricula_numero);
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('Error al registrar estudiante:', err);
      
      // Manejar errores de validación (422)
      if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
        const errores = err.response.data.detail;
        const mensajesError = errores.map((e: any) => {
          const campo = e.loc ? e.loc.join('.') : 'desconocido';
          return `${campo}: ${e.msg}`;
        }).join(', ');
        setError(`Errores de validación: ${mensajesError}`);
      } else {
        setError(err.response?.data?.detail || 'Error al registrar estudiante');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nuevo-estudiante-container">
      <PageHeader
        title="Registro de Nuevo Estudiante"
        subtitle="Complete todos los datos del estudiante"
        icon={<UserPlus size={20} />}
      />

      <form onSubmit={handleSubmit} className="estudiante-form">
        {/* Fotografía del Estudiante */}
        <div className="form-section">
          <h2>Fotografía del Estudiante *</h2>
          <div className="foto-section">
            {!fotoCapturada && !mostrarWebcam ? (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button type="button" className="btn-camera" onClick={iniciarWebcam}>
                  <Camera size={18} /> Tomar Foto
                </button>
                <button type="button" className="btn-camera btn-secondary" onClick={abrirArchivo}>
                  Subir Archivo
                </button>
              </div>
            ) : mostrarWebcam ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    borderRadius: '12px',
                    transform: 'scaleX(-1)'
                  }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-camera"
                    onClick={capturarFoto}
                  >
                    <Camera size={20} /> Capturar
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={detenerWebcam}
                  >
                    Cancelar
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            ) : (
              <div className="foto-preview">
                <img src={fotoCapturada} alt="Foto del estudiante" />
                <div className="foto-actions">
                  <button
                    type="button"
                    className="btn-recapture"
                    onClick={recapturarFoto}
                  >
                    <RotateCcw size={18} /> Cambiar Foto
                  </button>
                  <span className="foto-ok">
                    <Check size={18} /> Foto cargada
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Datos Personales */}
        <div className="form-section">
          <h2>Datos Personales</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="primerNombre">Primer Nombre *</label>
              <input
                id="primerNombre"
                type="text"
                value={primerNombre}
                onChange={(e) => setPrimerNombre(e.target.value.toUpperCase())}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="segundoNombre">Segundo Nombre</label>
              <input
                id="segundoNombre"
                type="text"
                value={segundoNombre}
                onChange={(e) => setSegundoNombre(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="primerApellido">Primer Apellido *</label>
              <input
                id="primerApellido"
                type="text"
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value.toUpperCase())}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="segundoApellido">Segundo Apellido</label>
              <input
                id="segundoApellido"
                type="text"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula *</label>
              <input
                id="cedula"
                type="text"
                value={cedula}
                onChange={(e) => setCedula(soloDigitos(e.target.value))}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
              <input
                id="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(soloDigitos(e.target.value))}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipoSangre">Tipo de Sangre</label>
              <select
                id="tipoSangre"
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
              >
                <option value="">Seleccione</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ciudad">Ciudad</label>
              <input
                id="ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="barrio">Barrio</label>
              <input
                id="barrio"
                type="text"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="eps">EPS</label>
              <input
                id="eps"
                type="text"
                value={eps}
                onChange={(e) => setEps(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ocupacion">Ocupación</label>
              <input
                id="ocupacion"
                type="text"
                value={ocupacion}
                onChange={(e) => setOcupacion(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estadoCivil">Estado Civil</label>
              <select
                id="estadoCivil"
                value={estadoCivil}
                onChange={(e) => setEstadoCivil(e.target.value)}
              >
                <option value="">Seleccione</option>
                <option value="SOLTERO">Soltero(a)</option>
                <option value="CASADO">Casado(a)</option>
                <option value="UNION_LIBRE">Unión Libre</option>
                <option value="DIVORCIADO">Divorciado(a)</option>
                <option value="VIUDO">Viudo(a)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nivelEducativo">Nivel Educativo</label>
              <select
                id="nivelEducativo"
                value={nivelEducativo}
                onChange={(e) => setNivelEducativo(e.target.value)}
              >
                <option value="">Seleccione</option>
                <option value="SIN_ESTUDIO">Sin Estudio</option>
                <option value="BASICA_PRIMARIA">Básica Primaria</option>
                <option value="BASICA_SECUNDARIA">Básica Secundaria</option>
                <option value="TECNICA">Técnica</option>
                <option value="PREGRADO">Pregrado</option>
                <option value="POSTGRADO">Postgrado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estrato">Estrato</label>
              <select
                id="estrato"
                value={estrato}
                onChange={(e) => setEstrato(e.target.value)}
              >
                <option value="">Seleccione</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nivelSisben">Nivel SISBEN</label>
              <input
                id="nivelSisben"
                type="text"
                value={nivelSisben}
                onChange={(e) => setNivelSisben(e.target.value.toUpperCase())}
                placeholder="Ej: A1, B2, C3"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="necesidadesEspeciales">Necesidades Especiales</label>
              <input
                id="necesidadesEspeciales"
                type="text"
                value={necesidadesEspeciales}
                onChange={(e) => setNecesidadesEspeciales(e.target.value.toUpperCase())}
                placeholder="Idioma, Discapacidad, Otra"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>
        </div>

        {/* Contacto de Emergencia */}
        <div className="form-section">
          <h2>Contacto de Emergencia</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="contactoEmergenciaNombre">Nombre del Contacto</label>
              <input
                id="contactoEmergenciaNombre"
                type="text"
                value={contactoEmergenciaNombre}
                onChange={(e) => setContactoEmergenciaNombre(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactoEmergenciaTelefono">Teléfono del Contacto</label>
              <input
                id="contactoEmergenciaTelefono"
                type="tel"
                value={contactoEmergenciaTelefono}
                onChange={(e) => setContactoEmergenciaTelefono(soloDigitos(e.target.value))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="habeas-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={aceptaHabeas}
              onChange={(e) => setAceptaHabeas(e.target.checked)}
            />
            Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012.
          </label>
          <p className="habeas-text">
            Se enviará un correo con el aviso de privacidad y los canales para ejercer tus derechos.
          </p>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const hayCambios = Boolean(
                primerNombre ||
                segundoNombre ||
                primerApellido ||
                segundoApellido ||
                cedula ||
                fechaNacimiento ||
                email ||
                telefono ||
                direccion ||
                ciudad ||
                barrio ||
                tipoSangre ||
                eps ||
                ocupacion ||
                estadoCivil ||
                nivelEducativo ||
                estrato ||
                nivelSisben ||
                necesidadesEspeciales ||
                contactoEmergenciaNombre ||
                contactoEmergenciaTelefono ||
                fotoCapturada
              );
              if (hayCambios && !confirm('Hay cambios sin guardar. ¿Deseas salir?')) {
                return;
              }
              navigate('/dashboard');
            }}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Estudiante'}
          </button>
        </div>
      </form>
    </div>
  );
};
