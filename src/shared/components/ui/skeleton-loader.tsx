import { motion } from "framer-motion";
import { Card, CardContent } from "@/shared/components/ui/card";

export const StatCardSkeleton = () => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <motion.div
                        className="h-4 bg-muted rounded w-20"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                        className="h-8 bg-muted rounded w-16"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div
                        className="h-3 bg-muted rounded w-24"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                </div>
                <motion.div
                    className="h-12 w-12 bg-muted rounded-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
            </div>
        </CardContent>
    </Card>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="rounded-md border">
        <div className="p-4 space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <motion.div
                    key={i}
                    className="flex items-center space-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                    <motion.div
                        className="h-4 bg-muted rounded flex-1"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                    <motion.div
                        className="h-4 bg-muted rounded w-20"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.1 }}
                    />
                    <motion.div
                        className="h-4 bg-muted rounded w-16"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.2 }}
                    />
                    <motion.div
                        className="h-4 bg-muted rounded w-12"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.3 }}
                    />
                </motion.div>
            ))}
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <Card>
        <CardContent className="p-6">
            <motion.div
                className="h-4 bg-muted rounded w-32 mb-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
                className="h-64 bg-muted rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
        </CardContent>
    </Card>
);
