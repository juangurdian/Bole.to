import {Modal} from "../../common/Modal/index.tsx";
import {GenericModalProps} from "../../../types.ts";
import classes from "./AboutModal.module.scss";

export const AboutModal = ({onClose}: GenericModalProps) => {
    return (
        <Modal onClose={onClose} opened>
            <div className={classes.aboutContainer}>
                <iframe src={'https://hi.' +
                    'events/about-embedded'}
                        className={classes.aboutIframe}
                        title="About"
                        allowFullScreen
                />
            </div>
        </Modal>
    );
}
