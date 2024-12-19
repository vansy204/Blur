/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import React, { useState } from 'react'
import "./Signup.css";


const Signin = () => {
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  
const handleSubmit = (event) =>{
  event.preventDefault();
  // khi an login thi goi ve api cua backend
  fetch("http://localhost:8080/identity/auth/token",{
    method: "POST",
    headers:{
      "Content-Type": "application/json",   // set content type thanh json
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  })
  .then((response) =>{
    return response.json();
  })
  .then((data)=>{
    console.log("Resonse body: ", data );
    if(data.code !== 1000){
      throw new Error("error:", data.message);
    }
    localStorage.setItem("token", data.result?.token);
  })
}
  return (
   
      <div className="container vertical-align ">
  <div className="row">
    <div className="col-lg-10 col-xl-9 mx-auto">
      <div className="card flex-row my-5 border-0 shadow rounded-3 overflow-hidden">
        <div className="card-img-left d-none d-md-flex translate-y-1">
          <img  className="background_blur" src="../blur.jpg" alt="blur.jpg"/>
        </div>
        <div className="card-body p-4 p-sm-5">
          <h5 className="card-title text-center mb-5 fw-light fs-5">Sign In to experience Blur</h5>
          <form>
           
          <div className="form-floating mb-3">
              <input type="text" className="form-control" id="username" placeholder="myusername" required autofocus />
              <label htmlFor="username">Username</label>
            </div>
            <hr />
            <div className="form-floating mb-3">
              <input type="password" className="form-control" id="floatingPassword" placeholder="Password" />
              <label htmlFor="floatingPassword">Password</label>
            </div>
            
            <div className="d-grid mb-2">
              <button className="btn btn-lg btn-primary btn-login fw-bold text-uppercase" type="submit">Register</button>
            </div>
            <a className="d-block text-center mt-2 small" href="/signup"> Don't have an account? Sign Up</a>
            <hr className="my-4" />
            <div className="d-grid mb-2">
              <button className="btn btn-lg btn-google btn-login fw-bold text-uppercase" type="submit">
                <i className="fab fa-google me-2" /> Sign up with Google
              </button>
            </div>
            <div className="d-grid">
              <button className="btn btn-lg btn-facebook btn-login fw-bold text-uppercase" type="submit">
                <i className="fab fa-facebook-f me-2" /> Sign up with Facebook
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>  
  )
}

export default Signin