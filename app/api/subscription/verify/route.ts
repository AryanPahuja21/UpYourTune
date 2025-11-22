import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prismaClient } from "@/app/lib/db";
import { updateSubscriptionPlan } from "@/app/lib/subscription";
import { Connection, PublicKey } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { txHash, plan, amount } = body as {
      txHash: string;
      plan: "BASIC" | "PREMIUM";
      amount: string;
    };

    if (!txHash || !plan || !amount) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const RPC_URL = process.env.SOL_RPC_URL || "";
    const PAYEE_ADDRESS = (process.env.PAYEE_ADDRESS || "").toString();
    if (!RPC_URL || !PAYEE_ADDRESS) {
      return NextResponse.json(
        { message: "Server not configured for blockchain payments" },
        { status: 500 }
      );
    }

    const conn = new Connection(RPC_URL);

    // Fetch parsed/confirmed transaction
    const txResp = await conn.getParsedTransaction(txHash, "confirmed");
    if (!txResp)
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );

    const expected = new PublicKey(PAYEE_ADDRESS);
    let found = false;
    let lamportsReceived = 0;

    const meta = txResp.meta;
    // Check instructions for system transfer to expected address
    const message = (txResp.transaction as any).message;
    if (message && Array.isArray(message.instructions)) {
      for (const ins of message.instructions) {
        if (ins.program === "system" && ins.parsed && ins.parsed.info) {
          const to = new PublicKey(ins.parsed.info.destination);
          const lam = parseInt(ins.parsed.info.lamports || 0, 10);
          if (to.equals(expected)) {
            found = true;
            lamportsReceived += lam;
          }
        }
      }
    }

    if (!found) {
      return NextResponse.json(
        { message: "Transaction did not send SOL to expected receiver" },
        { status: 400 }
      );
    }

    const requiredLamports = Math.round(parseFloat(amount) * 1e9);
    if (lamportsReceived < requiredLamports) {
      return NextResponse.json(
        { message: "Insufficient amount sent" },
        { status: 400 }
      );
    }

    // All good — update subscription for user
    const res = await updateSubscriptionPlan(user.id, plan);
    if (!res.success) {
      return NextResponse.json(
        { message: res.error || "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, subscription: res.subscription });
  } catch (e: any) {
    console.error("Error verifying crypto payment:", e);
    return NextResponse.json(
      { message: "Server error verifying transaction", error: e.message },
      { status: 500 }
    );
  }
}
