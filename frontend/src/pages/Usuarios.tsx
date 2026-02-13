import { useEffect, useState } from 'react';
import { Plus, Pencil, KeyRound, Shield } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { usuariosAPI } from '../services/api';
import { RolUsuario } from '../types';
import '../styles/Usuarios.css';

interface UsuarioItem {
  id: number;
  email: string;
  nombre_completo: string;
  cedula: string;
  telefono?: string;
  rol: RolUsuario;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  permisos_modulos?: string[];
}

const roles = [
  RolUsuario.ADMIN,
  RolUsuario.GERENTE,
  RolUsuario.COORDINADOR,
  RolUsuario.CAJERO,
  RolUsuario.INSTRUCTOR
];

const MODULOS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'nuevo_estudiante', label: 'Nuevo Estudiante' },
  { id: 'estudiantes', label: 'Estudiantes' },
  { id: 'caja', label: 'Caja / Pagos' },
  { id: 'caja_fuerte', label: 'Caja Fuerte' },
  { id: 'historial_cajas', label: 'Historial de Cajas' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'cierre_financiero', label: 'Cierre Financiero' },
  { id: 'instructores', label: 'Instructores' },
  { id: 'vehiculos', label: 'Vehículos' },
  { id: 'clases', label: 'Clases' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'tarifas', label: 'Tarifas' }
];

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [editando, setEditando] = useState<UsuarioItem | null>(null);
  const [passUsuario, setPassUsuario] = useState<UsuarioItem | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<RolUsuario>(RolUsuario.CAJERO);
  const [activo, setActivo] = useState(true);
  const [permisosModulos, setPermisosModulos] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosAPI.getAll({ search: search || undefined });
      setUsuarios(data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setEmail('');
    setPassword('');
    setNombre('');
    setCedula('');
    setTelefono('');
    setRol(RolUsuario.CAJERO);
    setActivo(true);
    setPermisosModulos([]);
    setShowModal(true);
  };

  const abrirEditar = (u: UsuarioItem) => {
    setEditando(u);
    setEmail(u.email);
    setPassword('');
    setNombre(u.nombre_completo);
    setCedula(u.cedula);
    setTelefono(u.telefono || '');
    setRol(u.rol);
    setActivo(u.is_active);
    setPermisosModulos(u.permisos_modulos || []);
    setShowModal(true);
  };

  const abrirReset = (u: UsuarioItem) => {
    setPassUsuario(u);
    setNewPassword('');
    setShowPassModal(true);
  };

  const guardar = async () => {
    if (!email || !nombre || !cedula || !rol) {
      setError('Completa los campos obligatorios');
      return;
    }
    if (activo && permisosModulos.length === 0) {
      setError('Selecciona al menos un módulo para habilitar acceso');
      return;
    }
    try {
      if (editando) {
        await usuariosAPI.update(editando.id, {
          email,
          nombre_completo: nombre,
          cedula,
          telefono: telefono || null,
          rol,
          is_active: activo,
          permisos_modulos: permisosModulos
        });
      } else {
        if (!password) {
          setError('La contraseña es obligatoria');
          return;
        }
        await usuariosAPI.create({
          email,
          password,
          nombre_completo: nombre,
          cedula,
          telefono: telefono || null,
          rol,
          is_active: activo,
          permisos_modulos: permisosModulos
        });
      }
      setShowModal(false);
      await cargarUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar usuario');
    }
  };

  const resetPassword = async () => {
    if (!passUsuario) return;
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await usuariosAPI.resetPassword(passUsuario.id, newPassword);
      setShowPassModal(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al resetear contraseña');
    }
  };

  return (
    <div className="usuarios-container">
      <PageHeader
        title="Usuarios"
        subtitle="Operadores y permisos del sistema"
        icon={<Shield size={20} />}
        actions={
          <button className="btn-nuevo" onClick={abrirNuevo}>
            <Plus size={16} /> Nuevo
          </button>
        }
      />

      <div className="search-section">
        <div className="search-box">
          <input
            className="search-input"
            placeholder="Buscar por nombre, email o cédula"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-nuevo btn-search" onClick={cargarUsuarios}>Buscar</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">Cargando usuarios...</div>
      ) : (
        <div className="usuarios-table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último login</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre_completo}</td>
                  <td>{u.email}</td>
                  <td>{u.telefono || '-'}</td>
                  <td>{u.rol}</td>
                  <td>{u.is_active ? 'Activo' : 'Inactivo'}</td>
                  <td>{u.last_login ? new Date(u.last_login).toLocaleString('es-CO') : '-'}</td>
                  <td>
                    <button className="btn-icon" onClick={() => abrirEditar(u)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => abrirReset(u)}>
                      <KeyRound size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7}>No hay usuarios</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
      <div className="modal-overlay">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre completo</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Correo (usuario)</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Cédula</label>
                <input value={cedula} onChange={(e) => setCedula(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              {!editando && (
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label>Rol</label>
                <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Acceso al sistema</label>
                <select value={activo ? 'SI' : 'NO'} onChange={(e) => setActivo(e.target.value === 'SI')}>
                  <option value="SI">Habilitado</option>
                  <option value="NO">Bloqueado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Permisos por módulo</label>
                <div className="modulos-grid">
                  {MODULOS.map((m) => (
                    <label key={m.id} className="modulo-item">
                      <input
                        type="checkbox"
                        checked={permisosModulos.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermisosModulos((prev) => [...prev, m.id]);
                          } else {
                            setPermisosModulos((prev) => prev.filter((x) => x !== m.id));
                          }
                        }}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showPassModal && passUsuario && (
      <div className="modal-overlay">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Resetear contraseña</h3>
              <button className="btn-icon" onClick={() => setShowPassModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPassModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={resetPassword}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
