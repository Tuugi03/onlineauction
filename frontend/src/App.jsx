import { useState } from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home, Layout, Login, Product, Register } from './routes';
function App() {
  return (
    <>
     <BrowserRouter>
      <Routes>
       <Route path="/" element={
        <Layout>
          <Home />
        </Layout>
        }/>
         <Route path="/register" element={
        <Layout>
          <Register />
        </Layout>
        }/>
        <Route path="/login" element={
        <Layout>
          <Login />
        </Layout>
        }/>
        <Route path="/allproduct" element={
        <Layout>
          <Product />
        </Layout>
        }/>
      </Routes>
     </BrowserRouter>
    </>
  )
}

export default App
