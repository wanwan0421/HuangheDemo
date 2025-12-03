import React from "react";
import { CheckCircle, Loader } from "lucide-react";
import { motion } from "framer-motion";

interface ModelExecuteProcessProps {
    status: String[];
}

const ModelExecuteProcess: React.FC<ModelExecuteProcessProps> = ({ status }) => {
    console.log("status: ", status);
    // get the last process status => current running progress status
    const lastStatus = status[status.length - 1];

    // judge whether the current progress is finished 
    const isProcessFinished = status.length > 0 && lastStatus?.endsWith("finished!");

    const currentStepIndex = isProcessFinished ? status.length : Math.max(0, status.length - 1);
    const processSteps = ["Check data format", "Data preprocessing", "Model core computing", "Output result generation in progress", "Model execution finished!"];

    return (
        <div className="mt-2">
            <div className="relative pl-3">
                {processSteps.map((step, index) => {
                    // Use the backend's status as the specific runtime. If it does not exist, use the default step name
                    const statusText = status[index] || step;

                    // Steps with an index smaller than the current index are considered complete
                    const isCompleted = index < currentStepIndex;
                    const isRunning = index === currentStepIndex && !isProcessFinished;
                    
                    return (
                        <div key={index} className="mb-8 relative">
                            {/* Vertical Line */}
                            {index < processSteps.length - 1 && (
                                <div className={`absolute top-6 bottom-[-30px] w-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-500'}`}></div>
                            )}

                            {/* // Status Dot */}
                            <div className="absolute left-0 transform -translate-x-1/2">
                                {isCompleted ? (
                                    <CheckCircle size={20} className="text-green-600 rounded-full" />
                                ) : isRunning ? (<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                    <Loader size={20} className="text-blue-500" />
                                </motion.div>
                                ) : (<div className="w-4 h-4 rounded-full bg-gray-400 border-2"></div>)
                                }
                            </div>

                            {/* Content */}
                            <p className={`pl-5 ${isCompleted || isProcessFinished ? 'text-green-600 font-semibold' : isRunning ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
                                {statusText}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ModelExecuteProcess;