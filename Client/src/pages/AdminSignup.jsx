import { Alert, Button, Label, Spinner, TextInput } from "flowbite-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

export default function AdminSignup() {
  const [formData, setFormData] = useState({});
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  // Request OTP
  const sendOtpHandler = async () => {
    if (!formData.email) return setErrorMessage("Please enter an email first.");

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/auth/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return setErrorMessage(data.message);
      
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      setErrorMessage("Error sending OTP.");
      setLoading(false);
    }
  };

  // Handle Signup Submission
  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !otp) {
      return setErrorMessage("Please fill all the fields and enter OTP.");
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch("http://localhost:3000/api/auth/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, otp }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return setErrorMessage(data.message);

      toast.success("Admin registered successfully!");
      navigate("/sign-in");
    } catch (error) {
      setErrorMessage("Signup failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-20">
      <div className="flex gap-5 p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center">
        {/* Left Section */}
        <div className="flex-1">
          <Link to="/" className="font-bold dark:text-white text-4xl">
            <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
              Admin
            </span>
            Panel
          </Link>
          <p className="text-sm mt-5">
            Securely create an admin account to manage the system efficiently.
          </p>
        </div>

        {/* Right Section */}
        <div className="flex-1">
          <form className="flex flex-col gap-4" onSubmit={submitHandler}>
            <Label value="Admin Username" />
            <TextInput type="text" placeholder="Username" id="username" onChange={changeHandler} />

            <Label value="Admin Email" />
            <TextInput type="email" placeholder="Email" id="email" onChange={changeHandler} />

            <Button onClick={sendOtpHandler} disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Send OTP"}
            </Button>

            {otpSent && (
              <>
                <Label value="Enter OTP" />
                <TextInput type="text" placeholder="Enter OTP" id="otp" onChange={(e) => setOtp(e.target.value.trim())} />

                <Label value="Admin Password" />
                <TextInput type="password" placeholder="Password" id="password" onChange={changeHandler} />

                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "Sign Up as Admin"}
                </Button>
              </>
            )}
          </form>

          {errorMessage && <Alert color="failure">{errorMessage}</Alert>}
        </div>
      </div>
    </div>
  );
}
