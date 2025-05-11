import { useState } from 'react'
import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home, Layout, Login, Product, Register, Profile, Admin, Details, ForgotPassword, ResetPassword, About, EditProduct } from './routes';


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
        <Route path="/profile" element={
        <Layout>
          <Profile />
        </Layout>
        }/>
        <Route path="/admin" element={
        <Layout>
          <Admin />
        </Layout>
        }/>
        <Route path="/products/:id" element={
          <Layout>
          <Details
           />
           </Layout>} />
           <Route path="/forgot-password" element={
          <Layout>
          <ForgotPassword
           />
           </Layout>} />
           <Route path="/reset-password/:token" element={
          <Layout>
          <ResetPassword
           />
           </Layout>} />
           <Route path="/about" element={
          <Layout>
          <About
           />
           </Layout>} />
           <Route path="/edit-product/:id" element={
          <Layout>
          <EditProduct
           />
           </Layout>} />
        
      </Routes>
     </BrowserRouter>
    </>
  )
}

export default App
