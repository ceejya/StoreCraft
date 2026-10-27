import { API_URL } from "./config"
import React, { useRef } from "react"
import { Routes, Route } from "react-router-dom"
import SignupForm from "./components/Signup"
import Login from "./components/Login"
import { ToastContainer } from "react-toastify"
import VerifyOtp from "./components/verifyotp"
import Dashboard from "./components/Dashboard"
import AddProduct from "./components/AddProduct"
import Storefront from "./components/Storefront"
import socketCilent from "socket.io-client"
import Sendproduct from "./components/Sendproduct"
import Landing from "./components/Landing"


const App = () => {
  const BaseUrl = API_URL
  const socketclient = useRef(socketCilent(BaseUrl))



  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/signup' element={<SignupForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/Dashboard" element={<Dashboard socket={socketclient.current} />} />
        <Route path="/add-product" element={<AddProduct socket={socketclient.current} />} />
        <Route path="/shop/:shopSlug" element={<Storefront />} />
        <Route path="/sendmessage" element={<Sendproduct socket={socketclient.current} />} />

      </Routes>


    </div>
  )

}


export default App
