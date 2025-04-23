import React, { useState, useEffect, useContext } from "react";
import useAuth from "../../utils/useAuth";
import { UserContext } from "../../App";
import { fetchUserData } from "../../utils/UserLogic";
import ButtonComponent from "../../utils/ButtonCompo";
import InputComponent from "../../utils/InputCompo";
// Show the QR with a random generated secret
// If QR is validated : save it in the DBB for the user
// If not, refuse the login and ask again until it works

// When loggin, check if 2FA is activated
// If yes, dont generate a secret but retrieve the one from the user
// Then just wait for the correct code

// Workflow Example
// Registration Phase:

//     User enables 2FA.
//     Backend generates a secret and QR code.
//     User scans QR code and validates OTP.
//     Backend saves the secret in the database.

// Login Phase:

//     User logs in with credentials.
//     Backend checks credentials and requests OTP.
//     User provides OTP.
//     Backend verifies OTP using the saved secret.

const TwoFactorAuth = () => {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [isValid, setIsValid] = useState(null);
  const {
    userData,
    setUserData,
    loading,
    error,
    matchHistory,
    setMatchHistory,
  } = useContext(UserContext); // Use context

  useEffect(() => {
    if (!userData) {
      // If userData is not available, fetch it
      fetchUserData(
        setUserData,
        setMatchHistory,
        () => {},
        () => {}
      );
    }
  }, [userData, setUserData, setMatchHistory]);

  //! make it so no access if not logged in
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading or not authenticated, do not render the navbar
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Fetch secret and QR code
  const generate2FA = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_IP}/2fa/generate`
      );
      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error) {
      console.error("Error generating 2FA:", error);
    }
  };

  // Verify OTP
  const verify2FA = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_IP}/2fa/add2FA`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, token: otp, intraId: userData?.id }),
        }
      );
      const data = await response.json();
      setIsValid(data.isValid);
      if (data.isValid) {
        {
          setTimeout(() => {
            // reload to show the key in the frontend
            window.location.reload();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <ButtonComponent onClick={generate2FA}>Generate QR Code</ButtonComponent>

      {qrCode && (
        <div>
          <h1>Scan this QR Code to add or change your user 2FA secret</h1>
          <img
            src={qrCode}
            alt="QR Code"
            style={{ border: "1px solid #ddd", padding: "10px" }}
          />
          {/* Remove the secret after, just for debugging */}
          {/* <p>Secret: <strong>{secret}</strong></p> */}
        </div>
      )}

      {secret && (
        <div style={{ marginTop: "20px" }}>
          <h2>Verify OTP to add or change Auth code</h2>
          <InputComponent
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          ></InputComponent>
          <ButtonComponent onClick={verify2FA}>Verify</ButtonComponent>
        </div>
      )}
      {isValid !== null && (
        <div style={{ marginTop: "20px" }}>
          <h3>{isValid ? "✅ OTP is valid!" : "❌ OTP is invalid."}</h3>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
