import { Session } from "@supabase/supabase-js";
import { LayoutGrid, Moon, Network, Sun, Trees } from "lucide-react";
import { useEffect, useState } from "react";
import { Auth } from "./components/Auth";
import { TaskControls } from "./components/TaskControls";
import TaskGraph from "./components/TaskGraph";
import { TaskList } from "./components/TaskList";
import { Button } from "./components/ui/button";
import { supabase } from "./lib/supabase";
import { useTaskStore } from "./store/taskStore";

function App() {
	const { isDarkMode, initializeTasks, isLoading, error, tasks, toggleDarkMode } = useTaskStore();
	const [session, setSession] = useState<Session | null>(null);
	const [viewMode, setViewMode] = useState<"list" | "graph">("list");

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (session) {
			initializeTasks();
		}
	}, [session, initializeTasks]);

	if (!session) {
		return <Auth />;
	}

	return (
		<div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
			<div className="container mx-auto py-8 px-4">
				<header className="mb-8 flex justify-between items-center">
					<div>
						<h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
							<Trees className="mr-2 inline align-middle" size={32} />
							<span className="align-middle">TaskTree</span>
						</h1>
						<p className={`mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
							Organize your tasks efficiently
						</p>
					</div>
					<div className="flex items-center space-x-4">
						<Button
							variant="outline"
							size="icon"
							onClick={() => setViewMode(viewMode === "list" ? "graph" : "list")}
							className="relative group"
						>
							{viewMode === "list" ? <Network className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
							<span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
								Switch to {viewMode === "list" ? "graph" : "list"} view
							</span>
						</Button>
						<Button variant="outline" size="icon" onClick={toggleDarkMode} className="relative group">
							{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							<span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
								Toggle theme
							</span>
						</Button>
						<Button variant="outline" onClick={() => supabase.auth.signOut()}>
							Sign out
						</Button>
					</div>
				</header>

				<main>
					{error ? (
						<div
							className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
							role="alert"
						>
							<strong className="font-bold">Error: </strong>
							<span className="block sm:inline">{error}</span>
						</div>
					) : isLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
						</div>
					) : (
						<>
							<TaskControls />
							{viewMode === "list" ? <TaskList /> : <TaskGraph tasks={tasks} isDarkMode={isDarkMode} />}
						</>
					)}
				</main>
			</div>
		</div>
	);
}

export default App;
