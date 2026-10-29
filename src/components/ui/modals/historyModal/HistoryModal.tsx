import {useEffect, useState} from 'react';
import DefaultModal from "../defaultModal/DefaultModal.tsx";
import type {PlinkoHistoryItemType} from "../../../../utils/types/Plinko.type.ts";
import {gameEvents} from "../../../../utils/gameEvents.ts";
import PlinkoHistoryItem from "../../plinkoHistory/components/PlinkoHistoryItem.tsx";
import {GameEventsEnum} from "../../../../utils/enums/gameEvents.enum.ts";
import {useModalStore} from "../../../../store/modalStore.ts";


const paragraphClass = 'text-white font-semibold text-[14px] uppercase';
const MAX_HISTORY_ITEMS = 100;

function HistoryModal() {
    const show = useModalStore(
        state => state.historyModal,
    );
    const toggleModal = useModalStore(
        state => state.toggleModal,
    );

    const [history, setHistory] = useState<{ [key: PlinkoHistoryItemType['id']]: PlinkoHistoryItemType }>({})

    useEffect(() => {
        const handleBallDropped = (data: PlinkoHistoryItemType) => {
            setHistory(
                (prev) => {
                    if (prev[data.id]) {
                        return prev;
                    }

                    // Keep only the most recent entries so the history doesn't grow unbounded
                    const entries = Object.entries(prev);
                    if (entries.length >= MAX_HISTORY_ITEMS) {
                        entries.sort(([, a], [, b]) => b.createdAt - a.createdAt);
                        entries.length = MAX_HISTORY_ITEMS - 1;
                    }

                    return {
                        ...Object.fromEntries(entries),
                        [data.id]: data
                    };
                }
            )
        };

        gameEvents.on(GameEventsEnum.BALL_DROPPED, handleBallDropped);

        return () => {
            gameEvents.off(GameEventsEnum.BALL_DROPPED, handleBallDropped)
        }
    }, [])

    return (
        <DefaultModal
            width={424}
            setShow={() => toggleModal('historyModal')}
            show={show}
            title={'History'}
            closeOnEscape
            showCloseButton
            closeOnOverlayClick
        >
            <div className={'flex flex-col gap-1 mt-3'}>
                <div className="grid grid-cols-4 items-center gap-3 px-2"
                >
                    <p className={`${paragraphClass}`}>Time</p>
                    <p className={`${paragraphClass}`}>Total Bet</p>
                    <p className={`${paragraphClass}`}>payout</p>
                    <p className={`${paragraphClass} text-center`}>profit</p>
                </div>
                <div className="overflow-scroll h-[376px] no-scrollbar">
                    <div className={'flex flex-col gap-1'}>
                        {Object.values(history)?.sort(
                            (a, b) => b.createdAt - a.createdAt
                        )?.map((item) => <PlinkoHistoryItem
                            key={item.id}
                            data={item}
                            handleRemove={() => {
                            }}
                            toBeRemoved={false}
                        />)}
                    </div>
                </div>
            </div>
        </DefaultModal>
    );
}

export default HistoryModal;