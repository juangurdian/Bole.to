import {PageTitle} from "../../../common/PageTitle/index.tsx";
import {t} from "@lingui/macro";
import {PageBody} from "../../../common/PageBody/index.tsx";
import {Badge, Button, Group} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react";
import {Card} from "../../../common/Card/index.tsx";
import {useDisclosure} from "@mantine/hooks";
import {WebhookTable} from "../../../common/WebhookTable/index.tsx";
import {useGetWebhooks} from "../../../../queries/useGetWebhooks.ts";
import {useParams} from "react-router";
import {CreateWebhookModal} from "../../../modals/CreateWebhookModal/index.tsx";
import {TableSkeleton} from "../../../common/TableSkeleton/index.tsx";

const Webhooks = () => {
    const {eventId} = useParams();
    const [createModalOpen, {open: openCreateModal, close: closeCreateModal}] = useDisclosure(false);
    const webhooksQuery = useGetWebhooks(eventId);
    const webhooks = webhooksQuery.data?.data?.data;

    const getWebhookCountText = () => {
        if (!webhooks) return t`Loading Webhooks`;
        if (webhooks.length === 0) return t`No Active Webhooks`;
        if (webhooks.length === 1) return t`1 Active Webhook`;
        return t`${webhooks.length} Active Webhooks`;
    };

    return (
        <PageBody>
            <PageTitle>
                {t`Webhooks`}
            </PageTitle>
            <Card>
                <Group justify="space-between">
                    <Button color={'green'} rightSection={<IconPlus/>} onClick={openCreateModal}>
                        {t`Add Webhook`}
                    </Button>
                    <Badge
                        variant="transparent"
                        size="lg"
                    >
                        {getWebhookCountText()}
                    </Badge>
                </Group>
            </Card>
            <div>
                <TableSkeleton isVisible={!webhooks}/>

                {webhooks && (<WebhookTable
                    webhooks={webhooks}
                    openCreateModal={openCreateModal}
                />)}
            </div>

            {createModalOpen && (
                <CreateWebhookModal
                    onClose={closeCreateModal}
                />
            )}
        </PageBody>
    );
}

export default Webhooks;
