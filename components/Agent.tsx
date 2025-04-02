"use client"

import { useEffect, useState } from "react";
import Image from "next/image"
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils"
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

const Agent = ({
    userName,
    userId,
    type,
    interviewId,
    feedbackId,
    questions,
}: AgentProps) => {
    const router = useRouter();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    const latestMessage = messages[messages.length - 1]?.content;

    const CALL_ACTIVE = callStatus === CallStatus.ACTIVE;
    const CALL_CONNECTING = callStatus === CallStatus.CONNECTING;
    const CALL_FINISHED = callStatus === CallStatus.FINISHED;
    const CALL_INACTIVE_OR_FINISHED = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript }; 

                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeakingStart = () => setIsSpeaking(true);
        const onSpeakingEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.error("Error", error);

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeakingStart);
        vapi.on("speech-end", onSpeakingEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeakingStart);
            vapi.off("speech-end", onSpeakingEnd);
            vapi.off("error", onError);
        }
    }, []);

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log("Generate feedback here.")

        const { success, feedbackId } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messages,
        })

        if (success && feedbackId) {
            router.push(`/interview/${interviewId}/feedback/${feedbackId}`);
        } else {
            console.error("Error saving feedback");
            router.push("/");
        }
    }

    useEffect(() => {
        if (CALL_FINISHED) {
            if (type === "generate") {
                router.push("/");
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if (type === "generate") {
            await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                variableValues: {
                    username: userName,
                    userid: userId,
                }
            });
        } else {
            let formattedQuestions = "";

            if (questions) {
                formattedQuestions = questions
                    .map(question => `- ${question}`)
                    .join("\n"); 
            }

            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestions,
                }
            });
        } 
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        
        vapi.stop();
    }

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image 
                            src="/ai-avatar.png"
                            alt="vapi"
                            width={65}
                            height={54}
                            className="object-cover"
                        />

                        {isSpeaking && <span className="animate-speak" /> }
                    </div>

                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image 
                            src="/user-avatar.png"
                            alt="user avatar"
                            width={540}
                            height={540}
                            className="rounded-full object-cover size-[120px]"
                        />

                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p 
                            className={cn("transition-opacity duration-500 opacity-0", "animate-fadeIn opacity-100")}
                            key={latestMessage}
                        >
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {!CALL_ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span className={cn(
                            "absolute animate-ping rounded-full opacity-75", 
                            !CALL_CONNECTING && "hidden")} 
                        />

                        <span>
                            {CALL_INACTIVE_OR_FINISHED ? "Call" : "..."}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}

export default Agent