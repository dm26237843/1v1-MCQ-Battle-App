import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { register, handleSubmit } = useForm();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await signup({ username: data.username, email: data.email, password: data.password });
      navigate('/lobby', { replace: true });
    } catch (e) {
      alert(e?.response?.data?.error?.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="input" {...register('username', { required: true, minLength: 3 })} placeholder="gamer123" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" {...register('password', { required: true, minLength: 8 })} />
        </div>
        <button className="btn w-full" type="submit">Create account</button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        Already have an account? <Link to="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}