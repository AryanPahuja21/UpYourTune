"use client";
import { signIn, signOut, useSession } from "next-auth/react";

const Navbar = () => {
  const session = useSession();

  return (
    <div>
      <h1>UpYourTune</h1>
      {session.data?.user ? (
        <button onClick={() => signOut()}>Logout</button>
      ) : (
        <button onClick={() => signIn()}>Login</button>
      )}
    </div>
  );
};

export default Navbar;
