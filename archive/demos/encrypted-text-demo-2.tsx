import { EncryptedText } from "@/shared/ui/encrypted-text"

export default function EncryptedTextDemoSecond() {
  return (
    <p className="mx-auto max-w-lg py-10 text-left">
      <EncryptedText
        encryptedClassName="text-neutral-500"
        revealDelayMs={50}
        revealedClassName="dark:text-white text-black"
        text="Welcome to the Matrix, Neo."
      />
    </p>
  )
}
