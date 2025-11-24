import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { RefreshCw, Zap, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/utils/api";

interface Marketplace {
    id: number;
    name: string;
    type: string;
    status: string;
    last_sync: string | null;
    connected_at: string;
}

export default function SyncSettings() {
    const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
    const [syncing, setSyncing] = useState<{ [key: number]: boolean }>({});
    const [testingConnection, setTestingConnection] = useState<{ [key: number]: boolean }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketplaces();
    }, []);

    const fetchMarketplaces = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getMarketplaces();
            setMarketplaces(data);
        } catch (error) {
            toast.error("Failed to load marketplaces");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (marketplaceId: number) => {
        setSyncing(prev => ({ ...prev, [marketplaceId]: true }));

        try {
            const result = await apiClient.syncMarketplace(marketplaceId.toString());
            toast.success(result.message);

            // Refresh marketplaces to get updated last_sync
            fetchMarketplaces();
        } catch (error) {
            toast.error("Sync failed");
            console.error(error);
        } finally {
            setSyncing(prev => ({ ...prev, [marketplaceId]: false }));
        }
    };

    const handleTestConnection = async (marketplaceId: number, marketplaceType: string) => {
        if (marketplaceType !== 'myntra') {
            toast.info("Connection testing is only available for Myntra channels");
            return;
        }

        setTestingConnection(prev => ({ ...prev, [marketplaceId]: true }));

        try {
            const result = await apiClient.testMyntraConnection(marketplaceId.toString());
            if (result.success) {
                toast.success(`Connection successful! Latency: ${result.latency}ms`);
            } else {
                toast.error(`Connection failed: ${result.message}`);
            }
        } catch (error) {
            toast.error("Connection test failed");
            console.error(error);
        } finally {
            setTestingConnection(prev => ({ ...prev, [marketplaceId]: false }));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'inactive':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'inactive':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const formatLastSync = (lastSync: string | null) => {
        if (!lastSync) return 'Never';
        return new Date(lastSync).toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sync Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage data synchronization with connected marketplaces</p>
                </div>
                <Button onClick={fetchMarketplaces} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connected Channels</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {marketplaces.filter(m => m.status === 'active').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active marketplaces
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {marketplaces.length > 0 ?
                                Math.max(...marketplaces
                                    .filter(m => m.last_sync)
                                    .map(m => new Date(m.last_sync!).getTime())
                                ) === -Infinity ? 'Never' :
                                    new Date(Math.max(...marketplaces
                                        .filter(m => m.last_sync)
                                        .map(m => new Date(m.last_sync!).getTime())
                                    )).toLocaleDateString() : 'Never'
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Most recent sync
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.values(syncing).filter(Boolean).length > 0 ? 'In Progress' : 'Idle'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current sync state
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading marketplaces...</div>
                    ) : marketplaces.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No marketplaces connected. Add a marketplace to get started.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Marketplace</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Sync</TableHead>
                                        <TableHead>Connected</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {marketplaces.map((marketplace) => (
                                        <TableRow key={marketplace.id}>
                                            <TableCell className="font-medium">{marketplace.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {marketplace.type.charAt(0).toUpperCase() + marketplace.type.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(marketplace.status)}
                                                    <Badge variant={getStatusColor(marketplace.status)}>
                                                        {marketplace.status.charAt(0).toUpperCase() + marketplace.status.slice(1)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatLastSync(marketplace.last_sync)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(marketplace.connected_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleSync(marketplace.id)}
                                                        disabled={syncing[marketplace.id] || marketplace.status !== 'active'}
                                                        size="sm"
                                                    >
                                                        {syncing[marketplace.id] ? (
                                                            <>
                                                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                Syncing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap className="h-3 w-3 mr-1" />
                                                                Sync Now
                                                            </>
                                                        )}
                                                    </Button>
                                                    {marketplace.type === 'myntra' && (
                                                        <Button
                                                            onClick={() => handleTestConnection(marketplace.id, marketplace.type)}
                                                            disabled={testingConnection[marketplace.id] || marketplace.status !== 'active'}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            {testingConnection[marketplace.id] ? (
                                                                <>
                                                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                    Testing...
                                                                </>
                                                            ) : (
                                                                'Test Connection'
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {Object.values(syncing).some(Boolean) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sync Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Synchronizing data...</span>
                                <span>Please wait</span>
                            </div>
                            <Progress value={45} className="w-full" />
                            <p className="text-xs text-muted-foreground">
                                This may take a few minutes depending on the amount of data.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
