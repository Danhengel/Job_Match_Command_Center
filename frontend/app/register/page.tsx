"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage(){
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const router=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError("");
    try{
      const result=await api("/api/auth/register",{method:"POST",body:JSON.stringify({full_name:fullName,email,password})});
      localStorage.setItem("token",result.access_token);
      router.push("/dashboard");
    }catch(err){ setError(err instanceof Error ? err.message : "Registration failed"); }
  }

  return <div className="card" style={{maxWidth:460,margin:"60px auto"}}>
    <h1>Create account</h1>
    <form onSubmit={submit}>
      <label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} required/>
      <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label>Password</label><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/>
      {error && <p className="error">{error}</p>}
      <button type="submit">Create account</button>
    </form>
    <p className="muted">Already registered? <Link href="/login">Sign in</Link></p>
  </div>;
}
