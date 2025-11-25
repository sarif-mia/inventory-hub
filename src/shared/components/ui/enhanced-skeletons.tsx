import { motion } from "framer-motion";
import { Card, CardContent } from "@/shared/components/ui/card";

export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <motion.div
          className="h-8 bg-muted rounded w-64 mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-80"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
      </div>
      <div className="flex gap-2">
        <motion.div className="h-10 w-24 bg-muted rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, delay: 0.2 }} />
        <motion.div className="h-10 w-20 bg-muted rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, delay: 0.3 }} />
      </div>
    </div>

    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <motion.div
                  className="h-4 bg-muted rounded w-20"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 }}
                />
                <motion.div
                  className="h-8 bg-muted rounded w-16"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 + 0.1 }}
                />
                <motion.div
                  className="h-3 bg-muted rounded w-24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 + 0.2 }}
                />
              </div>
              <motion.div
                className="h-12 w-12 bg-muted rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, delay: i * 0.1 + 0.3 }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <motion.div
              className="h-6 bg-muted rounded w-32 mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
            <motion.div
              className="h-80 bg-muted rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 + 0.1 }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const SalesReportsSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <motion.div
          className="h-8 bg-muted rounded w-64 mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-80"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
      </div>
      <div className="flex gap-2">
        <motion.div className="h-10 w-24 bg-muted rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, delay: 0.2 }} />
        <motion.div className="h-10 w-20 bg-muted rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, delay: 0.3 }} />
      </div>
    </div>

    {/* Filter Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <motion.div
              className="h-4 bg-muted rounded w-20 mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
            <motion.div
              className="h-10 bg-muted rounded w-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 + 0.1 }}
            />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <motion.div
                  className="h-4 bg-muted rounded w-20"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 }}
                />
                <motion.div
                  className="h-8 bg-muted rounded w-16"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 + 0.1 }}
                />
                <motion.div
                  className="h-3 bg-muted rounded w-24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, delay: i * 0.1 + 0.2 }}
                />
              </div>
              <motion.div
                className="h-12 w-12 bg-muted rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, delay: i * 0.1 + 0.3 }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts Skeleton */}
    <Card>
      <CardContent className="p-6">
        <motion.div
          className="h-6 bg-muted rounded w-32 mb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5 }}
        />
        <motion.div
          className="h-96 bg-muted rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.1 }}
        />
      </CardContent>
    </Card>

    {/* Tab Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <motion.div
              className="h-6 bg-muted rounded w-32 mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
            <motion.div
              className="h-80 bg-muted rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, delay: i * 0.1 + 0.1 }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const FilterChipsSkeleton = () => (
  <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
    <motion.div
      className="h-6 bg-muted rounded w-20"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5 }}
    />
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="h-6 bg-muted rounded w-24"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, delay: i * 0.1 }}
      />
    ))}
  </div>
);

export const ProductCardSkeleton = () => (
  <Card className="group hover:shadow-lg transition-all duration-200">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="h-4 w-4 bg-muted rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5 }}
          />
          <motion.div
            className="h-8 w-8 bg-muted rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, delay: 0.1 }}
          />
        </div>
        <motion.div
          className="h-8 w-8 bg-muted rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.2 }}
        />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <motion.div
          className="h-5 bg-muted rounded w-full mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-3/4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.4 }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <motion.div
          className="h-6 bg-muted rounded w-20"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.div
          className="h-6 bg-muted rounded w-16"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.6 }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <motion.div
          className="h-4 bg-muted rounded w-24"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-20"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <motion.div
          className="h-8 bg-muted rounded flex-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 0.9 }}
        />
        <motion.div
          className="h-8 w-8 bg-muted rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: 1.0 }}
        />
      </div>
    </CardContent>
  </Card>
);

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.1 }}
      >
        <ProductCardSkeleton />
      </motion.div>
    ))}
  </div>
);