import { Alert, Button, Label, Spinner, TextInput, Modal } from "flowbite-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { HiOutlineShieldCheck, HiOutlineLockClosed } from 'react-icons/hi';

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    secretCode: ''
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength calculator
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Length check
    if (formData.password.length >= 8) strength += 1;
    // Uppercase check
    if (/[A-Z]/.test(formData.password)) strength += 1;
    // Special character check
    if (/[\W_]/.test(formData.password)) strength += 1;
    // Number check
    if (/\d/.test(formData.password)) strength += 1;

    setPasswordStrength(strength);
  }, [formData.password]);

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const sendOtpHandler = async () => {
    if (!formData.email) {
      return setErrorMessage("Please enter an email first.");
    }

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

      if (!res.ok) {
        return setErrorMessage(data.message || "Failed to send OTP");
      }
      
      setOtpSent(true);
      toast.success("OTP sent to your email! Check your inbox.");
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !otp || !formData.secretCode) {
      return setErrorMessage("All fields are required.");
    }

    if (formData.secretCode !== import.meta.env.VITE_REACT_APP_ADMIN_SECRET) {
      console.log("Entered Secret Code: ", formData.secretCode);
      console.log("Expected Secret Code: ", import.meta.env.VITE_REACT_APP_ADMIN_SECRET);

      return setErrorMessage("Invalid admin secret code.");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return setErrorMessage('Password must be 8+ characters with uppercase, number, and special character.');
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/auth/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          otp,
          adminSecret: import.meta.env.VITE_REACT_APP_ADMIN_SECRET 
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return setErrorMessage(data.message || "Admin registration failed");
      }

      toast.success("Admin account created successfully!");
      navigate("/sign-in");
    } catch (error) {
      setErrorMessage("Server error. Please try again.");
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case 1: return 'red';
      case 2: return 'yellow';
      case 3: return 'blue';
      case 4: return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl p-6 space-y-8 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-1 rounded-lg">
              Admin
            </span> Registration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Secure admin portal setup with multi-factor authentication
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={submitHandler}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="username" value="Admin Username" />
                <TextInput
                  id="username"
                  type="text"
                  placeholder="username"
                  required
                  onChange={changeHandler}
                  icon={HiOutlineShieldCheck}
                />
              </div>
              
              <div>
                <Label htmlFor="email" value="Admin Email" />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  onChange={changeHandler}
                />
              </div>
            </div>

            <div>
              <Button 
                onClick={sendOtpHandler} 
                disabled={loading || !formData.email}
                className="w-full"
                gradientDuoTone="purpleToBlue"
              >
                {loading ? <Spinner size="sm" /> : "Send Verification OTP"}
              </Button>
            </div>

            {otpSent && (
              <>
                <div>
                  <Label htmlFor="otp" value="Verification Code" />
                  <TextInput
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    required
                    onChange={(e) => setOtp(e.target.value.trim())}
                  />
                </div>

                <div>
                  <Label htmlFor="password" value="Admin Password" />
                  <TextInput
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    onChange={changeHandler}
                    icon={HiOutlineLockClosed}
                  />
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700`}>
                        <div 
                          className={`h-2.5 rounded-full bg-${getPasswordStrengthColor()}-500`} 
                          style={{ width: `${passwordStrength * 25}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Must contain uppercase, number, and special character
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="secretCode" value="Admin Secret Code" />
                  <TextInput
                    id="secretCode"
                    type="password"
                    placeholder="Enter secret admin code"
                    required
                    onChange={changeHandler}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                  gradientDuoTone="pinkToOrange"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" /> Creating Admin Account...
                    </span>
                  ) : (
                    "Complete Admin Registration"
                  )}
                </Button>
              </>
            )}
          </form>

          {errorMessage && (
            <Alert color="failure" className="mt-4">
              {errorMessage}
            </Alert>
          )}

          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            Already have an admin account?{' '}
            <Link to="/sign-in" className="text-blue-600 hover:underline dark:text-blue-500">
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Secret Code Modal */}
      <Modal show={showSecretModal} onClose={() => setShowSecretModal(false)}>
        <Modal.Header>Admin Verification Required</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              To register as an admin, you need a special verification code from the system administrator.
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              Please contact your supervisor to obtain this code.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowSecretModal(false)}>I Understand</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}