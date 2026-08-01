"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const router=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError("");
    try{
      const result=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});
      localStorage.setItem("token",result.access_token);
      router.push("/dashboard");
    }catch(err){ setError(err instanceof Error ? err.message : "Login failed"); }
  }

  return <div className="card" style={{maxWidth:460,margin:"60px auto"}}>
    <h1>Sign in</h1><p className="muted">Access your private career workspace.</p>
    <form onSubmit={submit}>
      <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign in</button>
    </form>
    <p className="muted">New here? <Link href="/register">Create an account</Link></p>
  </div>;
}
