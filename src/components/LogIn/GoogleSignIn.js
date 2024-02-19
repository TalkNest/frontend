// src/GoogleSignIn.js
import React from 'react';
import { auth } from '../../firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';

function GoogleSignIn() {
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(async (result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                console.log(result);
                // The signed-in user info.
                const user = result.user;
                console.log('Google Sign in Success:', user);

                // Check if it's the first time this user has logged in
                const { isNewUser } = getAdditionalUserInfo(result);
                if (isNewUser) {
                    // Prepare the user data to send to the backend
                    const userData = {
                        userId: user.uid,
                        email: user.email,
                        username: user.displayName, // Or derive a username as per your app's logic
                        profilePicture: user.photoURL,
                        bio: '', // You might not have this information yet
                        location: '' // You might not have this information yet
                    };

                    // Send the user data to your backend API
                    fetch('http://localhost:8383/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userData),
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('User registration successful', data);
                        })
                        .catch((error) => {
                            console.error('Error in user registration:', error);
                        });
                }

                // You can redirect the user to another page or update the UI accordingly
                console.log("Log in successfully");
            }).catch((error) => {
            // Handle Errors here.
            console.error('Error during Google Sign in', error);
        });
    };

    return (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
    );
}

export default GoogleSignIn;