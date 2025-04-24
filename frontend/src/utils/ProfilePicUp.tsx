import React, { useState } from 'react';
import "../styles/ProfilePicUp.css"

const ProfilePictureUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle image file change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;

    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file)); // Set image preview URL
    }
  };

  // Handle image upload (for now, we just log the file)
  const handleUpload = () => {
    if (image) {
      ;
      // Normally, here you would upload the image to the server.
      // console.log('Uploading image:', image);
    }
  };

  return (
    <div className="profile-picture-upload">
      <div className="profile-picture-container">
        {imagePreview ? (
          <img src={imagePreview} alt="Profile Preview" className="profile-picture" />
        ) : (
          <div className="profile-picture-placeholder">No Profile Picture</div>
        )}
      </div>
      
      <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
      <button onClick={handleUpload} className="upload-btn">
        Upload Profile Picture
      </button>
    </div>
  );
};

export default ProfilePictureUpload;
