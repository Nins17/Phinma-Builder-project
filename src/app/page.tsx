import { RetakeChecker } from "./retake-checker";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-12 sm:py-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Quizes and Check in Retries Checker
        </h1>
        <p className="text-base text-muted-foreground">
          Enter your student number and the code your teacher gave you to see
          which P2 wrap-up quizzes and check-ins you need to retake.
        </p>
      </header>

      <RetakeChecker />

      <footer className="mt-auto border-t border-border pt-6 text-sm text-muted-foreground">
        Only you can see your record. Keep your code private.
      </footer>
    </main>
  );
}
