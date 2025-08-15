import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/lobby';

  const onSubmit = async (data) => {
    try {
      const payload = data.email?.includes('@')
        ? { email: data.email, password: data.password }
        : { username: data.email, password: data.password };
      await login(payload);
      navigate(from, { replace: true });
    } catch (e) {
      alert(e?.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email or Username</label>
          <input className="input" {...register('email', { required: true })} placeholder="you@example.com or username" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" {...register('password', { required: true })} />
        </div>
        <button className="btn w-full" type="submit">Log in</button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        New here? <Link to="/signup" className="link">Create an account</Link>
      </p>
    </div>
  );
}