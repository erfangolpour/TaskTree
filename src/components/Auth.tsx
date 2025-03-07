import { Trees } from "lucide-react";
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Auth() {
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const { error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			setError(error.message);
		}
		setLoading(false);
	};

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setError(error.message);
		}
		setLoading(false);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
			<div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
						<Trees className="mr-2 inline align-middle" size={32} />
            <span className="align-middle">TaskTree</span>
					</h2>
					<p className="mt-2 text-gray-600 dark:text-gray-300">Sign in to manage your tasks</p>
				</div>

				<form className="mt-8 space-y-6">
					{error && (
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<Label htmlFor="email">Email address</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="mt-1"
								placeholder="Enter your email"
							/>
						</div>

						<div>
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="mt-1"
								placeholder="Enter your password"
							/>
						</div>
					</div>

					<div className="flex flex-col space-y-4">
						<Button type="submit" onClick={handleSignIn} disabled={loading} className="w-full">
							{loading ? "Loading..." : "Sign in"}
						</Button>

						<Button
							type="button"
							onClick={handleSignUp}
							disabled={loading}
							variant="outline"
							className="w-full"
						>
							Create account
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
