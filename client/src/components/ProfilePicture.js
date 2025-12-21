import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';

const ProfilePicture = ({ profile, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl', 
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const containerClasses = `
    ${sizeClasses[size]} 
    rounded-full overflow-hidden shadow-lg flex items-center justify-center
    ${className}
  `;

  const fallbackClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    bg-gradient-to-br from-blue-500 to-purple-600 
    flex items-center justify-center
  `;

  // Check if profile picture is available and valid
  const hasValidProfilePicture = profile?.profilePicture && 
    profile.profilePicture.trim() !== '' && 
    !imageError;

  useEffect(() => {
    // Reset error state when profile changes
    setImageError(false);
    setImageLoading(false);
  }, [profile?.profilePicture]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  // Show loading state
  if (imageLoading) {
    return (
      <div className={containerClasses}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show profile picture if available
  if (hasValidProfilePicture) {
    return (
      <div className={containerClasses}>
        <img 
          src={profile.profilePicture}
          alt={profile.name || 'Profile'}
          className="w-full h-full object-cover"
          onLoadStart={handleImageLoadStart}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Show fallback avatar
  return (
    <div className={fallbackClasses}>
      <FaUser className="text-white" />
    </div>
  );
};

export default ProfilePicture;