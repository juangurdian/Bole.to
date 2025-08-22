import {useParams} from "react-router";
import {useGetEvent} from "../../../queries/useGetEvent.ts";
import {PageTitle} from "../../common/PageTitle/index.tsx";
import {PageBody} from "../../common/PageBody/index.tsx";
import {SearchBarWrapper} from "../../common/SearchBar/index.tsx";
import {useDisclosure} from "@mantine/hooks";
import {Pagination} from "../../common/Pagination/index.tsx";
import {Button} from "@mantine/core";
import {IconSend} from "@tabler/icons-react";
import {ToolBar} from "../../common/ToolBar/index.tsx";
import {useFilterQueryParamSync} from "../../../hooks/useFilterQueryParamSync.ts";
import {MessageType, QueryFilters} from "../../../types.ts";
import {TableSkeleton} from "../../common/TableSkeleton/index.tsx";
import {useGetEventMessages} from "../../../queries/useGetEventMessages.ts";
import {MessageList} from "../../common/MessageList/index.tsx";
import {SendMessageModal} from "../../modals/SendMessageModal/index.tsx";
import {t} from "@lingui/macro";

export const Messages = () => {
    const {eventId} = useParams();
    const {data: event} = useGetEvent(eventId);
    const [searchParams, setSearchParam] = useFilterQueryParamSync();
    const messagesQuery = useGetEventMessages(eventId, searchParams as QueryFilters);
    const messages = messagesQuery?.data?.data;
    const pagination = messagesQuery?.data?.meta;
    const [sendModalOpen, {open: openSendModal, close: closeSendModal}] = useDisclosure(false);

    return (
        <>
            <PageBody isFluid={false}>
                <PageTitle>{t`Messages`}</PageTitle>
                <ToolBar searchComponent={() => (
                    <SearchBarWrapper
                        placeholder={t`Search by subject or content...`}
                        setSearchParams={setSearchParam}
                        searchParams={searchParams}
                        pagination={pagination}
                    />
                )}>
                    <Button color={'green'} size={'sm'} onClick={openSendModal} rightSection={<IconSend/>}>
                        {t`Send Message`}
                    </Button>
                </ToolBar>

                <TableSkeleton isVisible={!messages || !event}/>

                {(event && messages) && (
                    <MessageList messages={messages}/>
                )}

                <TableSkeleton isVisible={!messages || messagesQuery.isFetching}/>

                {!!messages?.length && (
                    <Pagination
                        value={searchParams.pageNumber}
                        onChange={(value) => setSearchParam({pageNumber: value})}
                        total={Number(pagination?.last_page)}
                    />
                )}
            </PageBody>

            {sendModalOpen && <SendMessageModal messageType={MessageType.OrderOwner} onClose={closeSendModal}/>}
        </>
    );
};

export default Messages;
