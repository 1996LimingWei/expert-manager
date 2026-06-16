import { redirect } from 'next/navigation';

export default function Home() {
  // 根路径自动重定向（由 middleware 处理）
  // 这里作为 fallback
  redirect('/login');
}
