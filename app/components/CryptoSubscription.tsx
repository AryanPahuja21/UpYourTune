"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
// Solana
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

interface Props {
  plan: "BASIC" | "PREMIUM";
  // amount in native token (e.g., MATIC) as a string like "0.01"
  amount: string;
}

export default function CryptoSubscription({ plan, amount }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const PAYEE_ADDRESS = process.env.NEXT_PUBLIC_PAYEE_ADDRESS || ""; // Solana public key (base58)
  const SOL_NETWORK = process.env.NEXT_PUBLIC_SOL_NETWORK || "devnet"; // 'devnet' or 'testnet' or 'mainnet-beta'

  const connectAndPay = async () => {
    // Phantom Wallet flow
    const provider = (window as any).solana;
    if (!provider || !provider.isPhantom) {
      alert("No Phantom wallet found. Please install Phantom and try again.");
      return;
    }

    try {
      setConnecting(true);
      await provider.connect();
      const publicKey = provider.publicKey as PublicKey;

      // Create a connection to Solana
      const conn = new Connection(clusterApiUrl(SOL_NETWORK as any));

      // amount is in SOL string — convert to lamports
      const lamports = Math.round(parseFloat(amount) * 1e9);

      const toPub = new PublicKey(PAYEE_ADDRESS);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPub,
          lamports,
        })
      );

      // Set recent blockhash and fee payer before signing (required by Solana)
      const latest = await conn.getLatestBlockhash();
      tx.recentBlockhash = latest.blockhash;
      tx.feePayer = publicKey;

      setConnecting(false);
      setSending(true);
      setStatus("Requesting signature in wallet...");

      const signed = await provider.signTransaction(tx);
      setStatus("Transaction signed — sending to network...");

      const raw = await conn.sendRawTransaction(signed.serialize());
      setStatus(`Transaction submitted: ${raw}. Waiting for confirmation...`);

      const confirmed = await conn.confirmTransaction(raw, "confirmed");
      if (!confirmed.value || !confirmed.value.err) {
        setStatus("Transaction confirmed — verifying on server...");

        // Notify server to verify and grant subscription
        const resp = await axios.post("/api/subscription/verify", {
          txHash: raw,
          plan,
          amount,
        });

        if (resp.data && resp.data.success) {
          setStatus("Subscription updated successfully.");
          setTimeout(() => window.location.reload(), 1200);
        } else {
          setStatus(resp.data?.message || "Verification failed on server.");
        }
      } else {
        setStatus("Transaction failed or was reverted.");
      }
    } catch (e: any) {
      console.error("Crypto payment error:", e);
      setStatus(e?.message || "Payment failed");
    } finally {
      setConnecting(false);
      setSending(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={connectAndPay}
          disabled={
            !process.env.NEXT_PUBLIC_PAYEE_ADDRESS || connecting || sending
          }
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {connecting || sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" /> Pay with Wallet
            </>
          )}
        </Button>
        <div className="text-sm text-gray-600">{amount} SOL</div>
      </div>
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
      {!process.env.NEXT_PUBLIC_PAYEE_ADDRESS && (
        <p className="mt-2 text-xs text-red-600">
          Missing NEXT_PUBLIC_PAYEE_ADDRESS in env.
        </p>
      )}
    </div>
  );
}
